import type { ScopeClaim } from '@/lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      user?: {
        userId: string;
        username: string;
        orgId: string;
        role: string;
        permissions: string[];
        scope: ScopeClaim;
        mfa: boolean;
      };
    }
  }
}

export {};