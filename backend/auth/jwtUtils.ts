import jwt from 'jsonwebtoken';
import { IAuth } from '../types/IAuth';

export class JWTUtils {
  private static readonly SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
  private static readonly EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  static generateToken(payload: { userId: string; username: string; email: string }): string {
    return jwt.sign(payload, this.SECRET_KEY, { 
      expiresIn: this.EXPIRES_IN,
      issuer: 'realtime-chat-app',
      audience: 'chat-users'
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): IAuth | null {
    try {
      const decoded = jwt.verify(token, this.SECRET_KEY) as IAuth;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  static getUserInfoFromToken(token: string): { userId: string; username: string; email: string } | null {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.userId && decoded.username && decoded.email) {
        return {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
