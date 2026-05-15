import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors';

export interface JWTPayload {
  id: string;
  userId?: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'access-secret';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';

  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'access-secret';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
