import { describe, it, expect } from 'vitest';
import { isDatabaseAvailable } from '../utils/dbProbe.js';
import request from 'supertest';
import { getApp, login, bearer, DEMO_USERS } from './helpers.js';

const dbAvailable = await isDatabaseAvailable();
const describeDb = dbAvailable ? describe : describe.skip;

describeDb('E2E — Authentication', () => {
  it('health check responds', async () => {
    const app = getApp();
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.text).toContain('ok');
  });

  it('readiness check verifies DB + Redis', async () => {
    const app = getApp();
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body.data.dependencies.database.status).toBe('up');
    expect(res.body.data.dependencies.redis.status).toBe('up');
  });

  it('login succeeds with valid credentials', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: DEMO_USERS.piu, password: 'demo1234' });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeTruthy();
    expect(res.body.data.refresh_token).toBeTruthy();
    expect(res.body.data.user.role).toBe('MW-PIU');
  });

  it('login fails with invalid password', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: DEMO_USERS.piu, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('login fails for unknown user', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: 'nonexistent-user', password: 'demo1234' });

    expect(res.status).toBe(401);
  });

  it('GET /auth/me returns current user', async () => {
    const app = getApp();
    const { accessToken } = await login(DEMO_USERS.piu);
    const res = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(DEMO_USERS.piu);
    expect(res.body.data.permissions).toContain('project:read');
  });

  it('GET /auth/me rejects missing token', async () => {
    const app = getApp();
    const res = await request(app).get('/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /auth/me rejects malformed token', async () => {
    const app = getApp();
    const res = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('refresh token issues new access token', async () => {
    const app = getApp();
    const { refreshToken } = await login(DEMO_USERS.piu);

    const res = await request(app)
      .post('/v1/auth/refresh')
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeTruthy();
    expect(res.body.data.refresh_token).not.toBe(refreshToken); // rotated
  });

  it('logout revokes refresh token', async () => {
    const app = getApp();
    const { accessToken, refreshToken } = await login(DEMO_USERS.piu);

    const logoutRes = await request(app)
      .post('/v1/auth/logout')
      .set('Authorization', bearer(accessToken))
      .send({ refresh_token: refreshToken });
    expect(logoutRes.status).toBe(204);

    // Refresh should now fail
    const refreshRes = await request(app)
      .post('/v1/auth/refresh')
      .send({ refresh_token: refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  it('enforces RBAC — PIU cannot access admin endpoints', async () => {
    const app = getApp();
    const { accessToken } = await login(DEMO_USERS.piu);
    const res = await request(app)
      .get('/v1/admin/users')
      .set('Authorization', bearer(accessToken));
    expect(res.status).toBe(403);
  });

  it('allows admin to access admin endpoints', async () => {
    const app = getApp();
    const { accessToken } = await login(DEMO_USERS.admin);
    const res = await request(app)
      .get('/v1/admin/users')
      .set('Authorization', bearer(accessToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});