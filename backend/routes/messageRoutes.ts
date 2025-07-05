import { Router } from 'express';
import {
  createMessage,
  getMessageById,
  getConversationMessages,
  getRoomMessages,
  getUserMessages,
  updateMessage,
  deleteMessage,
  getRecentConversations,
  searchMessages,
  getReplies,
  getUserMessageStats
} from '../controllers/messageController';
import { authenticateToken, requireOwnership, optionalAuth } from '../auth/authMiddleware';

const router = Router();

// ===== SEARCH MESSAGES (protected, but optional for public searches) =====
// GET /api/messages/search?query=text&userId=optional&limit=20
router.get('/search', optionalAuth, searchMessages);

// ===== GET CONVERSATION MESSAGES (requires authentication) =====
// GET /api/messages/conversation/:userId1/:userId2
router.get('/conversation/:userId1/:userId2', authenticateToken, getConversationMessages);

// ===== GET ROOM MESSAGES (optional auth for public rooms) =====
// GET /api/messages/room/:roomId
router.get('/room/:roomId', optionalAuth, getRoomMessages);

// ===== GET USER MESSAGES (requires ownership) =====
// GET /api/messages/user/:userId
router.get('/user/:userId', authenticateToken, requireOwnership('userId'), getUserMessages);

// ===== GET RECENT CONVERSATIONS (requires ownership) =====
// GET /api/messages/user/:userId/conversations
router.get('/user/:userId/conversations', authenticateToken, requireOwnership('userId'), getRecentConversations);

// ===== GET USER MESSAGE STATS (requires ownership) =====
// GET /api/messages/user/:userId/stats
router.get('/user/:userId/stats', authenticateToken, requireOwnership('userId'), getUserMessageStats);

// ===== CREATE MESSAGE (requires authentication) =====
// POST /api/messages
router.post('/', authenticateToken, createMessage);

// ===== GET REPLIES TO A MESSAGE (optional authentication) =====
// GET /api/messages/:messageId/replies
router.get('/:messageId/replies', optionalAuth, getReplies);

// ===== GET MESSAGE BY ID (optional authentication) =====
// GET /api/messages/:id
router.get('/:id', optionalAuth, getMessageById);

// ===== UPDATE MESSAGE (requires authentication and ownership) =====
// PUT /api/messages/:id
router.put('/:id', authenticateToken, updateMessage);

// ===== DELETE MESSAGE (requires authentication and ownership) =====
// DELETE /api/messages/:id
router.delete('/:id', authenticateToken, deleteMessage);

export default router;
