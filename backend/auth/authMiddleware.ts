import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from './jwtUtils';
import { UserRepository } from '../db/repositories/UserRepository';

const userRepository = new UserRepository();

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {

    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    const decoded = JWTUtils.verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'INTERNAL_ERROR'
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = JWTUtils.verifyToken(token);
      
      if (decoded) {
        const user = await userRepository.findById(decoded.userId);
        
        if (user) {
          req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
          };
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

export const requireOwnership = (resourceUserIdField: string = 'fromUser') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || 
                          req.body[resourceUserIdField] || 
                          req.query[resourceUserIdField];

    if (!resourceUserId) {
      res.status(400).json({
        success: false,
        message: `${resourceUserIdField} is required`,
        error: 'MISSING_RESOURCE_USER_ID'
      });
      return;
    }

    if (req.user.userId !== resourceUserId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: 'ACCESS_DENIED'
      });
      return;
    }

    next();
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const userRole = 'user';
      
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: 'INTERNAL_ERROR'
      });
    }
  };
};

const userRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

export const rateLimitByUser = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user.userId;
    const now = Date.now();
    const windowStart = now - windowMs;

    const userStats = userRequestCounts.get(userId);

    if (!userStats || userStats.resetTime < windowStart) {
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userStats.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userStats.resetTime - now) / 1000)
      });
      return;
    }

    userStats.count++;
    next();
  };
};
