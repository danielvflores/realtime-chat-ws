import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUserStatus } from '../controllers/userController';

const router = Router();

// GET /api/users - Get all users
router.get('/', getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create a new user
router.post('/', createUser);

// PATCH /api/users/:id/status - Update user online status
router.patch('/:id/status', updateUserStatus);

export default router;
