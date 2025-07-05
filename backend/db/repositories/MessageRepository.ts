import database from '../database';
import { MessageEntity } from '../../entities/Message';
import { IMessage, IMessageCreate } from '../../types/IMessage';

export class MessageRepository {

  async createMessage(messageData: IMessageCreate): Promise<IMessage> {
    const messageEntity = new MessageEntity(messageData);
    
    const query = `
      INSERT INTO messages (
        id, fromUser, toUser, message, messageDate, 
        roomFromMessage, messageType, replyTo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await database.run(query, [
      messageEntity.id,
      messageEntity.fromUser,
      messageEntity.toUser || null,
      messageEntity.message,
      messageEntity.messageDate,
      messageEntity.roomFromMessage || null,
      messageEntity.messageType,
      messageEntity.replyTo || null
    ]);

    return messageEntity.toJSON();
  }

  async getMessageById(id: string): Promise<IMessage | null> {
    const query = 'SELECT * FROM messages WHERE id = ?';
    const row = await database.get(query, [id]);
    
    if (!row) return null;
    
    return this.mapRowToMessage(row);
  }

  async getConversationMessages(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<IMessage[]> {
    const query = `
      SELECT m.*, 
             u.username as fromUserUsername,
             u.email as fromUserEmail
      FROM messages m
      LEFT JOIN users u ON m.fromUser = u.id
      WHERE (m.fromUser = ? AND m.toUser = ?) OR (m.fromUser = ? AND m.toUser = ?)
      ORDER BY m.messageDate ASC 
      LIMIT ? OFFSET ?
    `;
    
    const rows = await database.all(query, [userId1, userId2, userId2, userId1, limit, offset]);
    return rows.map((row: any) => this.mapRowToMessageWithUser(row));
  }

  async getRoomMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<IMessage[]> {
    const query = `
      SELECT * FROM messages 
      WHERE roomFromMessage = ?
      ORDER BY messageDate DESC 
      LIMIT ? OFFSET ?
    `;
    
    const rows = await database.all(query, [roomId, limit, offset]);
    return rows.map((row: any) => this.mapRowToMessage(row));
  }

  async getUserMessages(userId: string, limit: number = 50, offset: number = 0): Promise<IMessage[]> {
    const query = `
      SELECT * FROM messages 
      WHERE fromUser = ? OR toUser = ?
      ORDER BY messageDate DESC 
      LIMIT ? OFFSET ?
    `;
    
    const rows = await database.all(query, [userId, userId, limit, offset]);
    return rows.map((row: any) => this.mapRowToMessage(row));
  }

  async updateMessage(messageId: string, fromUserId: string, newContent: string): Promise<IMessage | null> {
    // Verificar que el mensaje existe y pertenece al usuario
    const existingMessage = await this.getMessageById(messageId);
    if (!existingMessage || existingMessage.fromUser !== fromUserId) {
      return null;
    }

    const query = `
      UPDATE messages 
      SET message = ?, isEdited = 1, editedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND fromUser = ?
    `;

    await database.run(query, [newContent, messageId, fromUserId]);
    return await this.getMessageById(messageId);
  }

  async deleteMessage(messageId: string, fromUserId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM messages WHERE id = ? AND fromUser = ?';
      await database.run(query, [messageId, fromUserId]);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  async getRecentConversations(userId: string, limit: number = 10): Promise<IMessage[]> {
    const query = `
      SELECT m1.* FROM messages m1
      INNER JOIN (
        SELECT 
          CASE 
            WHEN fromUser = ? THEN toUser 
            ELSE fromUser 
          END as other_user,
          MAX(messageDate) as last_message_date
        FROM messages 
        WHERE (fromUser = ? OR toUser = ?) AND toUser IS NOT NULL
        GROUP BY other_user
      ) m2 ON (
        (m1.fromUser = ? AND m1.toUser = m2.other_user) OR 
        (m1.fromUser = m2.other_user AND m1.toUser = ?)
      ) AND m1.messageDate = m2.last_message_date
      ORDER BY m1.messageDate DESC
      LIMIT ?
    `;
    
    const rows = await database.all(query, [userId, userId, userId, userId, userId, limit]);
    return rows.map((row: any) => this.mapRowToMessage(row));
  }

  async searchMessages(query: string, userId?: string, limit: number = 20): Promise<IMessage[]> {
    let sqlQuery = `
      SELECT * FROM messages 
      WHERE message LIKE ?
    `;
    const params: any[] = [`%${query}%`];

    if (userId) {
      sqlQuery += ' AND (fromUser = ? OR toUser = ?)';
      params.push(userId, userId);
    }

    sqlQuery += ' ORDER BY messageDate DESC LIMIT ?';
    params.push(limit);

    const rows = await database.all(sqlQuery, params);
    return rows.map((row: any) => this.mapRowToMessage(row));
  }

  async getReplies(messageId: string): Promise<IMessage[]> {
    const query = `
      SELECT * FROM messages 
      WHERE replyTo = ?
      ORDER BY messageDate ASC
    `;
    
    const rows = await database.all(query, [messageId]);
    return rows.map((row: any) => this.mapRowToMessage(row));
  }

  async countConversationMessages(userId1: string, userId2: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM messages 
      WHERE (fromUser = ? AND toUser = ?) OR (fromUser = ? AND toUser = ?)
    `;
    
    const row = await database.get<{ count: number }>(query, [userId1, userId2, userId2, userId1]);
    return row?.count || 0;
  }

  async countRoomMessages(roomId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM messages WHERE roomFromMessage = ?';
    const row = await database.get<{ count: number }>(query, [roomId]);
    return row?.count || 0;
  }

  private mapRowToMessage(row: any): IMessage {
    return {
      id: row.id,
      fromUser: row.fromUser,
      toUser: row.toUser,
      message: row.message,
      messageDate: row.messageDate,
      roomFromMessage: row.roomFromMessage,
      messageType: row.messageType as 'text' | 'image' | 'file' | 'system',
      isEdited: Boolean(row.isEdited),
      editedAt: row.editedAt,
      replyTo: row.replyTo
    };
  }

  private mapRowToMessageWithUser(row: any): IMessage & { fromUserData?: { id: string; username: string; email: string } } {
    return {
      id: row.id,
      fromUser: row.fromUser,
      toUser: row.toUser,
      message: row.message,
      messageDate: row.messageDate,
      roomFromMessage: row.roomFromMessage,
      messageType: row.messageType as 'text' | 'image' | 'file' | 'system',
      isEdited: Boolean(row.isEdited),
      editedAt: row.editedAt,
      replyTo: row.replyTo,
      fromUserData: row.fromUserUsername ? {
        id: row.fromUser,
        username: row.fromUserUsername,
        email: row.fromUserEmail
      } : undefined
    };
  }

  async getUserMessageStats(userId: string): Promise<{
    totalSent: number;
    totalReceived: number;
    totalEdited: number;
  }> {
    const sentQuery = 'SELECT COUNT(*) as count FROM messages WHERE fromUser = ?';
    const receivedQuery = 'SELECT COUNT(*) as count FROM messages WHERE toUser = ?';
    const editedQuery = 'SELECT COUNT(*) as count FROM messages WHERE fromUser = ? AND isEdited = 1';

    const [sent, received, edited] = await Promise.all([
      database.get<{ count: number }>(sentQuery, [userId]),
      database.get<{ count: number }>(receivedQuery, [userId]),
      database.get<{ count: number }>(editedQuery, [userId])
    ]);

    return {
      totalSent: sent?.count || 0,
      totalReceived: received?.count || 0,
      totalEdited: edited?.count || 0
    };
  }
}
