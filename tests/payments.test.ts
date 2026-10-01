import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData } from './setup';

async function getAuthToken(email = 'payments@test.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'Password1', name: 'Payment Test' });
  return res.body.token;
}

describe('Payment screenshot URLs', () => {
  it('regenerates the signed URL on read instead of using the stored (expired) one', async () => {
    const email = 'screenshot@test.com';
    const token = await getAuthToken(email);

    mockSupabaseData.payment_requests.push({
      id: 'pay-test-1',
      user_email: email,
      user_name: 'Payment Test',
      payment_method: 'cbe',
      amount: 299,
      transaction_ref: 'TX123',
      screenshot_url: 'https://example.com/expired-old-url',
      screenshot_path: `${email}/payment-old.jpg`,
      status: 'pending',
      admin_notes: '',
      created_at: new Date().toISOString(),
      reviewed_at: null,
    });

    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].screenshotUrl).toBe(`https://example.com/signed/${email}/payment-old.jpg`);
  });

  it('falls back to the stored URL when the path is missing', async () => {
    const email = 'legacy@test.com';
    const token = await getAuthToken(email);

    mockSupabaseData.payment_requests.push({
      id: 'pay-test-2',
      user_email: email,
      user_name: 'Legacy',
      payment_method: 'telebirr',
      amount: 299,
      transaction_ref: 'TX456',
      screenshot_url: 'https://example.com/stored-url',
      screenshot_path: null,
      status: 'pending',
      admin_notes: '',
      created_at: new Date().toISOString(),
      reviewed_at: null,
    });

    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].screenshotUrl).toBe('https://example.com/stored-url');
  });
});
