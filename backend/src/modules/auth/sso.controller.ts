import type { Request, Response } from 'express';
import { createHmac, createHash, createPublicKey, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env, corsOrigins } from '@/config/env.js';
import { sendSuccess } from '@/lib/response.js';
import { UnauthorizedError } from '@/lib/errors.js';
import * as authService from './auth.service.js';

type OidcMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
};
type SsoState = { state: string; nonce: string; verifier: string; issuedAt: number };
let cachedMetadata: OidcMetadata | null = null;

function configuration() {
  const issuer = env.IDP_ISSUER_URL;
  const clientId = env.IDP_CLIENT_ID;
  const clientSecret = env.IDP_CLIENT_SECRET;
  const apiPublicUrl = env.API_PUBLIC_URL;
  const frontendUrl = env.FRONTEND_URL ?? corsOrigins[0];
  if (!issuer || !clientId || !clientSecret || !apiPublicUrl || !frontendUrl) return null;
  return { issuer: issuer.replace(/\/$/, ''), clientId, clientSecret, apiPublicUrl: apiPublicUrl.replace(/\/$/, ''), frontendUrl: frontendUrl.replace(/\/$/, '') };
}

async function metadataFor(issuer: string): Promise<OidcMetadata> {
  if (cachedMetadata?.issuer === issuer) return cachedMetadata;
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Identity provider discovery failed');
  const data = await response.json() as OidcMetadata;
  if (data.issuer !== issuer || !data.authorization_endpoint || !data.token_endpoint || !data.jwks_uri) {
    throw new Error('Identity provider metadata is invalid');
  }
  cachedMetadata = data;
  return data;
}

function signState(state: SsoState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  const signature = createHmac('sha256', env.JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readStateCookie(req: Request): SsoState | null {
  const rawCookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('piims_sso='));
  if (!rawCookie) return null;
  const value = decodeURIComponent(rawCookie.slice('piims_sso='.length));
  const dot = value.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const supplied = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(createHmac('sha256', env.JWT_SECRET).update(payload).digest('base64url'));
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SsoState;
    if (!parsed.state || !parsed.nonce || !parsed.verifier || Date.now() - parsed.issuedAt > 5 * 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cookieOptions() {
  return `Path=/; Max-Age=300; HttpOnly; SameSite=Lax${env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

function clearStateCookie(res: Response) {
  res.setHeader('Set-Cookie', `piims_sso=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export function ssoStatusHandler(_req: Request, res: Response): void {
  const config = configuration();
  sendSuccess(res, { enabled: Boolean(config), provider: config ? 'Government identity provider' : null });
}

export async function ssoStartHandler(_req: Request, res: Response): Promise<void> {
  const config = configuration();
  if (!config) {
    res.status(503).json({ title: 'Government SSO is not configured', detail: 'Contact the PIIMS administrator.' });
    return;
  }
  try {
    const metadata = await metadataFor(config.issuer);
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    res.setHeader('Set-Cookie', `piims_sso=${encodeURIComponent(signState({ state, nonce, verifier, issuedAt: Date.now() }))}; ${cookieOptions()}`);
    res.setHeader('Cache-Control', 'no-store');
    const authorize = new URL(metadata.authorization_endpoint);
    authorize.searchParams.set('client_id', config.clientId);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('redirect_uri', `${config.apiPublicUrl}${env.API_BASE_PATH}/auth/sso/callback`);
    authorize.searchParams.set('scope', 'openid profile email');
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('nonce', nonce);
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 'S256');
    res.redirect(302, authorize.toString());
  } catch {
    res.status(502).json({ title: 'Government identity provider unavailable', detail: 'Please try again later or use your assigned PIIMS credentials.' });
  }
}

export async function ssoCallbackHandler(req: Request, res: Response): Promise<void> {
  const config = configuration();
  if (!config) {
    res.status(503).send('Government SSO is not configured. Contact the PIIMS administrator.');
    return;
  }
  const state = readStateCookie(req);
  clearStateCookie(res);
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const returnedState = typeof req.query.state === 'string' ? req.query.state : '';
  if (!state || !code || !returnedState || state.state !== returnedState) {
    res.status(400).send('SSO sign-in could not be validated. Return to PIIMS and try again.');
    return;
  }

  try {
    const metadata = await metadataFor(config.issuer);
    const redirectUri = `${config.apiPublicUrl}${env.API_BASE_PATH}/auth/sso/callback`;
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: state.verifier,
    });
    const tokenResponse = await fetch(metadata.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenResponse.ok) throw new Error('Code exchange failed');
    const tokenBody = await tokenResponse.json() as { id_token?: string };
    if (!tokenBody.id_token) throw new Error('ID token missing');

    const decoded = jwt.decode(tokenBody.id_token, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid || decoded.header.alg !== 'RS256') {
      throw new Error('ID token header is invalid');
    }
    const jwksResponse = await fetch(metadata.jwks_uri, { signal: AbortSignal.timeout(8000) });
    if (!jwksResponse.ok) throw new Error('Signing keys unavailable');
    const jwks = await jwksResponse.json() as { keys: Array<JsonWebKey & { kid?: string; use?: string }> };
    const jwk = jwks.keys.find((key) => key.kid === decoded.header.kid && (!key.use || key.use === 'sig'));
    if (!jwk) throw new Error('ID token signing key not found');
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
    const claims = jwt.verify(tokenBody.id_token, publicKey, {
      issuer: metadata.issuer,
      audience: config.clientId,
      algorithms: ['RS256'],
    }) as jwt.JwtPayload;
    if (claims.nonce !== state.nonce || typeof claims.email !== 'string' || claims.email_verified !== true) {
      throw new Error('Identity claims failed validation');
    }
    const amr = Array.isArray(claims.amr) ? claims.amr.map(String) : [];
    const acr = typeof claims.acr === 'string' ? claims.acr : '';
    const mfaVerified = amr.some((method) => ['mfa', 'otp', 'hwk', 'swk', 'sms'].includes(method.toLowerCase())) || /mfa|multi.?factor/i.test(acr);

    const result = await authService.ssoLogin(claims.email.toLowerCase(), mfaVerified, {
      ipAddress: req.ip ?? null,
      userAgent: req.header('user-agent') ?? null,
      correlationId: (req.res?.locals as Record<string, unknown> | undefined)?.correlationId as string | null ?? null,
    });

    const target = new URL('/auth/callback', config.frontendUrl);
    target.hash = new URLSearchParams({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: String(result.expires_in),
      refresh_expires_in: String(result.refresh_expires_in),
      user: JSON.stringify(result.user),
    }).toString();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.redirect(302, target.toString());
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, `${config.frontendUrl}/login?sso_error=1`);
  }
}
