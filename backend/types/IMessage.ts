export interface IMessage {
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
}

export interface IMessageWithUser {
  id: string;
  fromUser: {
    id: string;
    username: string;
    avatar?: string;
  };
  toUser?: {
    id: string;
    username: string;
  };
  message: string;
  messageDate: Date;
  roomFromMessage?: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: string;
}

export interface IMessageCreate {
  fromUser: string;
  toUser?: string;          
  message: string;
  roomFromMessage?: string;   
  messageType?: 'text' | 'image' | 'file';
  replyTo?: string;           
}

export interface IMessageUpdate {
  message?: string;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface IMessageFilters {
  roomId?: string;
  fromUserId?: string;
  toUserId?: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  startDate?: Date;
  endDate?: Date;
}