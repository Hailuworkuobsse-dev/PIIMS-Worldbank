import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(120),
  password: z.string().min(1, 'Password is required').max(200),
  mfa_code: z.string().trim().regex(/^\d{6}$/, 'MFA code must be 6 digits').optional(),
  remember_device: z.boolean().optional().default(false)
});
export type LoginInput = z.infer<typeof loginSchema>;

export const mfaVerifySchema = z.object({
  mfa_token: z.string().min(20, 'MFA token is required'),
  mfa_code: z.string().trim().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
  remember_device: z.boolean().optional().default(false)
});
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;

export const refreshSchema = z.object({
  refresh_token: z.string().min(20, 'Refresh token is required')
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const logoutSchema = z.object({
  refresh_token: z.string().min(20).optional()
}).optional();
export type LogoutInput = z.infer<typeof logoutSchema>;

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(12, 'New password must be at least 12 characters').max(128)
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const mfaEnableSchema = z.object({
  mfa_code: z.string().trim().regex(/^\d{6}$/, 'MFA code must be 6 digits')
});
export type MfaEnableInput = z.infer<typeof mfaEnableSchema>;

export const mfaDisableSchema = z.object({
  password: z.string().min(1, 'Password is required')
});
export type MfaDisableInput = z.infer<typeof mfaDisableSchema>;
export const policyAcceptanceSchema = z.object({ policy_version: z.string().trim().min(1).max(40) });
export type PolicyAcceptanceInput = z.infer<typeof policyAcceptanceSchema>;
