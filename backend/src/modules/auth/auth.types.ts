import type { RoleCode } from '@/features/auth/auth.types.js';

/**
 * Public user shape returned by the API.
 * Matches the frontend's `AuthUser` type exactly.
 */
export interface AuthUser {
  userId: string;
  username: string;
  fullName: string;
  fullNameAm?: string;
  email: string;
  orgId: string;
  orgName: string;
  role: RoleCode;
  roleName: string;
  permissions: string[];
  scope: AuthScope;
  mfaEnabled: boolean;
  locale: 'en' | 'am';
  lastLoginAt: string;
}

export interface AuthScope {
  orgLevel: 'FEDERAL' | 'REGIONAL' | 'ZONAL' | 'WOREDA' | 'KEBELE' | 'EXTERNAL';
  regions?: string[];
  zones?: string[];
  woredas?: string[];
  kebeles?: string[];
  ownRecordsOnly?: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  mfa_required?: boolean;
  mfa_token?: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface MfaSetupResponse {
  secret: string;
  qrUri: string;
}

export interface MfaEnableResponse {
  enabled: true;
  recoveryCodes?: string[];
}