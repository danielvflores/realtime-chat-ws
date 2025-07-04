import { Request, Response } from 'express';
import { IUserRegister, IUserPublic } from '../types/IUser';
import userRepository from '../db/repositories/UserRepository';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userRepository.findAll();
    const publicUsers: IUserPublic[] = users.map(user => user.toPublic());
    
    res.json({
      success: true,
      data: publicUsers,
      count: publicUsers.length
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userRepository.findById(id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: `User with ID: ${id} not found`
      });
      return;
    }
    
    res.json({
      success: true,
      data: user.toPublic()
    });
  } catch (error) {
    console.error('Error getting user by id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: IUserRegister = req.body;
    
    if (!userData.username || !userData.email || !userData.password) {
      res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
      return;
    }

    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
      return;
    }

    const existingUsername = await userRepository.findByUsername(userData.username);
    if (existingUsername) {
      res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
      return;
    }

    const newUser = await userRepository.create(userData);
    
    if (!newUser.isValidUsername()) {
      res.status(400).json({
        success: false,
        message: 'Invalid username. Must be 3-20 characters, alphanumeric and underscore only'
      });
      return;
    }

    if (!newUser.isValidEmail()) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser.toPublic()
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;
    
    const user = await userRepository.updateOnlineStatus(id, isOnline);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      message: `User status updated to ${isOnline ? 'online' : 'offline'}`,
      data: user.toPublic()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
