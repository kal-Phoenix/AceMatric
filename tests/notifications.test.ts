import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData } from './setup';

async function getAuthToken(email = 'notif@test.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'Password1', name: 'Notif Test' });
  return res.body.token;
}

async function createNotification(token: string, data: any) {
  return request(app)
    .post('/api/notifications/create')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
}

describe('Notification Routes', () => {
  describe('POST /api/notifications/create', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/notifications/create')
        .send({ title: 'Test', message: 'Hello' });
      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      const token = await getAuthToken();
      const res = await createNotification(token, { title: 'Test', message: 'Hello' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/notifications', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/notifications?email=test@test.com');
      expect(res.status).toBe(401);
    });

    it('should return notifications for authenticated user', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .get('/api/notifications?email=notif@test.com')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/notifications/read-all')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(401);
    });

    it('should use authenticated user email (not body)', async () => {
      const token = await getAuthToken('readall@test.com');
      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'someone-else@test.com' });
      expect(res.status).toBe(200);
    });
  });
});
