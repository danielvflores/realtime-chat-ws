import { Request, Response } from 'express';
import { MessageRepository } from '../db/repositories/MessageRepository';
import { IMessageCreate } from '../types/IMessage';

const messageRepository = new MessageRepository();

// ===== CREATE MESSAGE =====
export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const messageData: IMessageCreate = req.body;

    if (req.user) {
      messageData.fromUser = req.user.userId;
    }

    if (!messageData.fromUser || !messageData.message) {
      res.status(400).json({
        success: false,
        message: 'fromUser and message are required fields'
      });
      return;
    }

    if (!messageData.toUser && !messageData.roomFromMessage) {
      res.status(400).json({
        success: false,
        message: 'Either toUser or roomFromMessage must be provided'
      });
      return;
    }

    const message = await messageRepository.createMessage(messageData);
    
    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: message
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== GET MESSAGE BY ID =====
export const getMessageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
      return;
    }

    const message = await messageRepository.getMessageById(id);

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== GET CONVERSATION MESSAGES =====
export const getConversationMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId1, userId2 } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId1 || !userId2) {
      res.status(400).json({
        success: false,
        message: 'Both userId1 and userId2 are required'
      });
      return;
    }

    const messages = await messageRepository.getConversationMessages(userId1, userId2, limit, offset);
    const totalCount = await messageRepository.countConversationMessages(userId1, userId2);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + messages.length < totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== GET ROOM MESSAGES =====
export const getRoomMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!roomId) {
      res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
      return;
    }

    const messages = await messageRepository.getRoomMessages(roomId, limit, offset);
    const totalCount = await messageRepository.countRoomMessages(roomId);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + messages.length < totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== GET USER MESSAGES =====
export const getUserMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const messages = await messageRepository.getUserMessages(userId, limit, offset);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          limit,
          offset,
          total: messages.length,
          hasMore: messages.length === limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== UPDATE MESSAGE =====
export const updateMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!id || !message) {
      res.status(400).json({
        success: false,
        message: 'Message ID and message content are required'
      });
      return;
    }

    // Usar el usuario autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const updatedMessage = await messageRepository.updateMessage(id, req.user.userId, message);

    if (!updatedMessage) {
      res.status(404).json({
        success: false,
        message: 'Message not found or you do not have permission to edit this message'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: updatedMessage
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== DELETE MESSAGE =====
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const deleted = await messageRepository.deleteMessage(id, req.user.userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Message not found or you do not have permission to delete this message'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== GET RECENT CONVERSATIONS =====
export const getRecentConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const conversations = await messageRepository.getRecentConversations(userId, limit);

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== SEARCH MESSAGES =====
export const searchMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    const { userId } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const messages = await messageRepository.searchMessages(
      query, 
      userId as string | undefined, 
      limit
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== GET REPLIES =====
export const getReplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
      return;
    }

    const replies = await messageRepository.getReplies(messageId);

    res.status(200).json({
      success: true,
      data: replies
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ===== GET USER MESSAGE STATS =====
export const getUserMessageStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const stats = await messageRepository.getUserMessageStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
