import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** SHA-256 hex digest */
export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Constant-time string comparison (for tokens, HMACs) */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** URL-safe random token */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Hex-encoded random bytes */
export function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** Hash chain for audit log — each record includes prevHash + recordHash */
export function hashChain(prevHash: string, payload: unknown): { prevHash: string; recordHash: string } {
  const serialized = JSON.stringify(payload);
  const recordHash = sha256(`${prevHash}|${serialized}`);
  return { prevHash, recordHash };
}