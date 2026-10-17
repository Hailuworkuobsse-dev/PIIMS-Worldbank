import request from 'supertest';
import type { Express } from 'express';
import { buildApp } from '@/app.js';

let cachedApp: Express | null = null;

export function getApp(): Express {
  if (!cachedApp) cachedApp = buildApp();
  return cachedApp;
}

export async function login(
  username: string,
  password = 'demo1234'
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const app = getApp();
  const res = await request(app)
    .post('/v1/auth/login')
    .send({ username, password });

  if (res.status !== 200) {
    throw new Error(`Login failed for ${username}: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.data.access_token,
    refreshToken: res.body.data.refresh_token,
    userId: res.body.data.user.userId
  };
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}

export const DEMO_USERS = {
  admin: 'mowe.admin',
  piu: 'mowe.piu01',
  ie: 'mowe.ie01',
  qa: 'mowe.qa01',
  dc: 'dc.en01',
  wb: 'wb.ttl01',
  mof: 'mof.bo01',
  supplier: 'sp.admin'
} as const;