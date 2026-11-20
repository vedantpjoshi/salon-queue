import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';

const COOKIE = 'glamour_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  return process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-session-secret');
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function sessionIsValid(req: Request) {
  const key = secret();
  if (!key) return false;
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  const token = cookie?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [payload, suppliedSignature] = token.split('.');
  if (!payload || !suppliedSignature) return false;
  const expected = signature(payload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return false;
  const expires = Number(Buffer.from(payload, 'base64url').toString('utf8'));
  return Number.isFinite(expires) && expires > Math.floor(Date.now() / 1000);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!sessionIsValid(req)) {
    res.status(401).json({ error: 'Admin sign-in required' });
    return;
  }
  next();
}

export function setupAdminAuth(app: import('express').Express) {
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const configuredPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'salon123');
    const supplied = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!configuredPassword || !secret()) {
      res.status(503).json({ error: 'Admin sign-in is not configured yet' });
      return;
    }
    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(configuredPassword);
    const matches = suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
    if (!matches) {
      res.status(401).json({ error: 'That password doesn’t match. Try again.' });
      return;
    }
    const payload = Buffer.from(String(Math.floor(Date.now() / 1000) + SESSION_SECONDS)).toString('base64url');
    res.cookie(COOKIE, `${payload}.${signature(payload)}`, {
      httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production',
      path: '/', maxAge: SESSION_SECONDS * 1000,
    });
    res.json({ authenticated: true });
  });

  app.get('/api/admin/session', (req: Request, res: Response) => {
    res.json({ authenticated: sessionIsValid(req) });
  });

  app.post('/api/admin/logout', (_req: Request, res: Response) => {
    res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
    res.json({ authenticated: false });
  });
}
