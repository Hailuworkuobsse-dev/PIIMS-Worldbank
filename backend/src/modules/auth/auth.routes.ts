import { Router } from 'express';
import { validate } from '@/middleware/validate.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { loginRateLimiter } from '@/middleware/loginRateLimiter.js';
import {
  loginSchema, mfaVerifySchema, refreshSchema,
  changePasswordSchema, mfaEnableSchema, mfaDisableSchema
} from './auth.schemas.js';
import {
  loginHandler, mfaVerifyHandler, refreshHandler, logoutHandler,
  meHandler, changePasswordHandler, mfaSetupHandler,
  mfaEnableHandler, mfaDisableHandler
} from './auth.controller.js';

export const authRouter: Router = Router();

/* ─── Public ──────────────────────────────────────────────────── */
authRouter.post('/login', loginRateLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.post('/mfa/verify', loginRateLimiter, validate({ body: mfaVerifySchema }), mfaVerifyHandler);
authRouter.post('/refresh', validate({ body: refreshSchema }), refreshHandler);

/* ─── Authenticated ───────────────────────────────────────────── */
authRouter.post('/logout', requireAuth, logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.post(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  changePasswordHandler
);
authRouter.post('/mfa/setup', requireAuth, mfaSetupHandler);
authRouter.post('/mfa/enable', requireAuth, validate({ body: mfaEnableSchema }), mfaEnableHandler);
authRouter.post('/mfa/disable', requireAuth, validate({ body: mfaDisableSchema }), mfaDisableHandler);