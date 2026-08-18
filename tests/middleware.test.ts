import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

describe('JWT Token Logic', () => {
  it('should generate a valid token', () => {
    const token = generateToken({ email: 'test@test.com', name: 'Test' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid token', () => {
    const payload = { email: 'test@test.com', name: 'Test', role: 'student' };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.email).toBe('test@test.com');
    expect(decoded.name).toBe('Test');
    expect(decoded.role).toBe('student');
  });

  it('should reject an invalid token', () => {
    const decoded = verifyToken('invalid.token.here');
    expect(decoded).toBeNull();
  });

  it('should reject a token with wrong secret', () => {
    const token = jwt.sign({ email: 'test@test.com' }, 'wrong-secret');
    const decoded = verifyToken(token);
    expect(decoded).toBeNull();
  });

  it('should include role in admin token', () => {
    const token = generateToken({ email: 'admin@test.com', name: 'Admin', role: 'admin' });
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('admin');
  });

  it('should include role in student token', () => {
    const token = generateToken({ email: 'student@test.com', name: 'Student', role: 'student' });
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('student');
  });
});

describe('Password Strength Validation', () => {
  function validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) return { valid: false, error: 'Too short' };
    if (!/[A-Z]/.test(password)) return { valid: false, error: 'No uppercase' };
    if (!/[a-z]/.test(password)) return { valid: false, error: 'No lowercase' };
    if (!/[0-9]/.test(password)) return { valid: false, error: 'No number' };
    return { valid: true };
  }

  it('should accept strong passwords', () => {
    expect(validatePassword('Password1').valid).toBe(true);
    expect(validatePassword('MyStr0ngPass').valid).toBe(true);
    expect(validatePassword('Ab123456').valid).toBe(true);
  });

  it('should reject short passwords', () => {
    expect(validatePassword('Ab12').valid).toBe(false);
    expect(validatePassword('Pass1').valid).toBe(false);
  });

  it('should reject passwords without uppercase', () => {
    expect(validatePassword('lowercase1').valid).toBe(false);
    expect(validatePassword('allsmall1').valid).toBe(false);
  });

  it('should reject passwords without lowercase', () => {
    expect(validatePassword('ALLUPPER1').valid).toBe(false);
    expect(validatePassword('NOLOWER1').valid).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    expect(validatePassword('NoNumbers').valid).toBe(false);
    expect(validatePassword('LettersOnly').valid).toBe(false);
  });
});

describe('Email Validation', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it('should accept valid emails', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('test@domain.co')).toBe(true);
    expect(EMAIL_REGEX.test('name.last@uni.edu.et')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(EMAIL_REGEX.test('notanemail')).toBe(false);
    expect(EMAIL_REGEX.test('@example.com')).toBe(false);
    expect(EMAIL_REGEX.test('user@')).toBe(false);
    expect(EMAIL_REGEX.test('user @example.com')).toBe(false);
  });
});
