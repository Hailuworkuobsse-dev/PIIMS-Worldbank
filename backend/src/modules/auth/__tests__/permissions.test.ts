import { describe, it, expect } from 'vitest';
import { matchesPermission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions.js';

describe('permissions', () => {
  it('matches exact permission', () => {
    expect(matchesPermission('project:read', 'project:read')).toBe(true);
    expect(matchesPermission('project:read', 'project:write')).toBe(false);
  });

  it('matches wildcard *', () => {
    expect(matchesPermission('*', 'anything:goes')).toBe(true);
  });

  it('matches prefix wildcard project:*', () => {
    expect(matchesPermission('project:*', 'project:read')).toBe(true);
    expect(matchesPermission('project:*', 'project:write')).toBe(true);
    expect(matchesPermission('project:*', 'inception:read')).toBe(false);
  });

  it('hasPermission with array', () => {
    const perms = ['project:read', 'inception:submit'];
    expect(hasPermission(perms, 'project:read')).toBe(true);
    expect(hasPermission(perms, 'project:delete')).toBe(false);
  });

  it('hasAnyPermission', () => {
    expect(hasAnyPermission(['project:read'], ['project:read', 'admin:users'])).toBe(true);
    expect(hasAnyPermission(['project:read'], ['admin:users', 'admin:roles'])).toBe(false);
  });

  it('hasAllPermissions', () => {
    expect(hasAllPermissions(['a:1', 'a:2'], ['a:1', 'a:2'])).toBe(true);
    expect(hasAllPermissions(['a:1'], ['a:1', 'a:2'])).toBe(false);
  });
});