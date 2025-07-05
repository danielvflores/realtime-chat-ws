import { v4 as uuidv4 } from 'uuid';
import { IMessage, IMessageCreate, IMessageUpdate, IMessageWithUser } from '../types/IMessage';

export class MessageEntity implements IMessage {
  id: string;
  fromUser: string;
  toUser?: string;
  message: string;
  messageDate: Date;
  roomFromMessage?: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: string;

  constructor(messageData: Partial<IMessage> | IMessageCreate) {
    this.id = 'id' in messageData && messageData.id ? messageData.id : uuidv4();
    this.fromUser = messageData.fromUser || '';
    this.toUser = messageData.toUser;
    this.message = messageData.message || '';
    this.messageDate = 'messageDate' in messageData && messageData.messageDate ? messageData.messageDate : new Date();
    this.roomFromMessage = messageData.roomFromMessage;
    this.messageType = messageData.messageType || 'text';
    this.isEdited = 'isEdited' in messageData ? messageData.isEdited || false : false;
    this.editedAt = 'editedAt' in messageData ? messageData.editedAt : undefined;
    this.replyTo = messageData.replyTo;
  }

  // ===== VALIDATION METHODS =====
  
  isValidMessage(): boolean {
    return this.message.trim().length > 0 && this.message.length <= 1000;
  }

  isValidMessageType(): boolean {
    return ['text', 'image', 'file', 'system'].includes(this.messageType);
  }

  isValidForSending(): boolean {
    return this.isValidMessage() && 
           this.isValidMessageType() && 
           this.fromUser.length > 0;
  }

  // ===== MESSAGE TYPE CHECKS =====
  
  isDirectMessage(): boolean {
    return !!this.toUser && !this.roomFromMessage;
  }

  isRoomMessage(): boolean {
    return !!this.roomFromMessage && !this.toUser;
  }

  isGlobalMessage(): boolean {
    return !this.toUser && !this.roomFromMessage;
  }

  isSystemMessage(): boolean {
    return this.messageType === 'system';
  }

  isReply(): boolean {
    return !!this.replyTo;
  }

  // ===== PERMISSION METHODS =====
  
  canEdit(userId: string): boolean {
    return this.fromUser === userId && 
           this.messageType !== 'system' &&
           !this.isOlderThan(24);
  }

  canDelete(userId: string): boolean {
    return this.fromUser === userId;
  }

  isFromUser(userId: string): boolean {
    return this.fromUser === userId;
  }

  isToUser(userId: string): boolean {
    return this.toUser === userId;
  }

  // ===== UPDATE METHODS =====
  
  edit(newMessage: string): void {
    if (this.message !== newMessage) {
      this.message = newMessage;
      this.isEdited = true;
      this.editedAt = new Date();
    }
  }

  update(updateData: IMessageUpdate): void {
    if (updateData.message !== undefined) {
      this.edit(updateData.message);
    }
  }

  // ===== UTILITY METHODS =====
  
  isOlderThan(hours: number): boolean {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.messageDate < hoursAgo;
  }

  getAge(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.messageDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  getPreview(maxLength: number = 50): string {
    if (this.message.length <= maxLength) {
      return this.message;
    }
    return this.message.substring(0, maxLength) + '...';
  }

  // ===== CONVERSION METHODS =====
  
  toJSON(): IMessage {
    return {
      id: this.id,
      fromUser: this.fromUser,
      toUser: this.toUser,
      message: this.message,
      messageDate: this.messageDate,
      roomFromMessage: this.roomFromMessage,
      messageType: this.messageType,
      isEdited: this.isEdited,
      editedAt: this.editedAt,
      replyTo: this.replyTo
    };
  }

  // ===== STATIC FACTORY METHODS =====
  
  static createMessage(messageData: IMessageCreate): MessageEntity {
    return new MessageEntity(messageData);
  }

  static createDirectMessage(fromUser: string, toUser: string, message: string): MessageEntity {
    return new MessageEntity({
      fromUser,
      toUser,
      message,
      messageType: 'text'
    });
  }

  static createRoomMessage(fromUser: string, roomId: string, message: string): MessageEntity {
    return new MessageEntity({
      fromUser,
      roomFromMessage: roomId,
      message,
      messageType: 'text'
    });
  }

  static createGlobalMessage(fromUser: string, message: string): MessageEntity {
    return new MessageEntity({
      fromUser,
      message,
      messageType: 'text'
    });
  }

  static createSystemMessage(message: string, roomId?: string): MessageEntity {
    return new MessageEntity({
      fromUser: 'system',
      message,
      messageType: 'system',
      roomFromMessage: roomId
    });
  }

  static createReply(fromUser: string, replyToId: string, message: string, toUser?: string, roomId?: string): MessageEntity {
    return new MessageEntity({
      fromUser,
      toUser,
      roomFromMessage: roomId,
      message,
      messageType: 'text',
      replyTo: replyToId
    });
  }

  static fromDatabase(dbData: IMessage): MessageEntity {
    return new MessageEntity(dbData);
  }
}
