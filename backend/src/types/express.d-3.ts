import type { ScopeClaim } from '@/lib/jwt.js';
import type { File as MulterFile } from 'multer';

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
      file?: MulterFile;
      files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
    }
  }
}

export {};