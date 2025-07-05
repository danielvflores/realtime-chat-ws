import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../db/repositories/UserRepository';
import { JWTUtils } from '../auth/jwtUtils';
import { ILoginRequest, ILoginResponse, IAuthResponse } from '../types/IAuth';
import { IUserRegister } from '../types/IUser';

const userRepository = new UserRepository();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: IUserRegister = req.body;

    if (!userData.username || !userData.email || !userData.password) {
      res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    if (userData.password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
      return;
    }

    const user = await userRepository.create(userData);

    const token = JWTUtils.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    const response: ILoginResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          isOnline: user.isOnline
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: ILoginRequest = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    await userRepository.updateOnlineStatus(user.id, true);

    const token = JWTUtils.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    const response: ILoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          isOnline: true
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    await userRepository.updateOnlineStatus(req.user.userId, false);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const response: IAuthResponse = {
      success: true,
      message: 'Token is valid',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user.toPublic()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
      return;
    }

    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await userRepository.update(user.id, { password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
