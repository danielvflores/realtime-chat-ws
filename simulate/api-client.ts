import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
  };
  token: string;
  expiresIn: string;
}

export interface Message {
  id: string;
  fromUser: string;
  toUser?: string;
  roomFromMessage?: string;
  message: string;
  messageType: string;
  messageDate: string; // Cambiado de sentAt a messageDate para coincidir con el backend
  replyTo?: string;
  isEdited: boolean; // Cambiado de edited a isEdited para coincidir con el backend
  editedAt?: string;
  fromUserData?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface ConversationResponse {
  messages: Message[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ChatAPI {
  private token: string = '';
  private userId: string = '';
  private username: string = '';

  // Autenticación
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password }
      );

      if (response.data.success && response.data.data) {
        this.token = response.data.data.token;
        this.userId = response.data.data.user.id;
        this.username = response.data.data.user.username;
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Network error during login');
    }
  }

  // Enviar mensaje
  async sendMessage(toUserId: string, message: string): Promise<Message> {
    try {
      const response: AxiosResponse<ApiResponse<Message>> = await axios.post(
        `${API_BASE_URL}/messages`,
        {
          fromUser: this.userId,
          toUser: toUserId,
          message: message,
          messageType: 'text'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Network error while sending message');
    }
  }

  // Obtener conversación
  async getConversation(otherUserId: string, limit: number = 20): Promise<ConversationResponse> {
    try {
      const response: AxiosResponse<ApiResponse<ConversationResponse>> = await axios.get(
        `${API_BASE_URL}/messages/conversation/${this.userId}/${otherUserId}?limit=${limit}&offset=0`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get conversation');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Network error while getting conversation');
    }
  }

  // Obtener todos los usuarios
  async getAllUsers(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get users');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Network error while getting users');
    }
  }

  // Buscar usuario por email
  async getUserByEmail(email: string): Promise<any> {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error(`User with email ${email} not found`);
      }
      
      return user;
    } catch (error: any) {
      throw error;
    }
  }

  // Obtener perfil del usuario autenticado
  async getProfile() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get profile');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Network error while getting profile');
    }
  }

  // Getters
  get currentUserId(): string {
    return this.userId;
  }

  get currentUsername(): string {
    return this.username;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }
}
