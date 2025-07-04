import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { IUser, IUserPublic, IUserRegister, IUserUpdate } from '../types/IUser';

export class UserEntity implements IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;

  constructor(userData: Partial<IUser> | IUserRegister) {
    this.id = 'id' in userData && userData.id ? userData.id : uuidv4();
    this.username = userData.username || '';
    this.email = userData.email || '';
    this.password = userData.password || '';
    this.avatar = userData.avatar;
    this.isOnline = false;
    this.lastSeen = new Date();
    this.createdAt = 'createdAt' in userData && userData.createdAt ? userData.createdAt : new Date();
  }

  // ===== AUTH METHODS =====
  
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  // ===== ONLINE METHOTDS =====
  
  setOnline(): void {
    this.isOnline = true;
    this.updateLastSeen();
  }

  setOffline(): void {
    this.isOnline = false;
    this.updateLastSeen();
  }

  updateLastSeen(): void {
    this.lastSeen = new Date();
  }

  // ===== isValide METHODS =====
  
  isValidForChat(): boolean {
    return this.isOnline && this.isValidUsername() && this.isValidEmail();
  }

  isValidUsername(): boolean {
    return this.username.length >= 3 && 
           this.username.length <= 20 && 
           /^[a-zA-Z0-9_]+$/.test(this.username);
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  canSendMessage(): boolean {
    return this.isOnline && this.isValidUsername();
  }

  // ===== UPDATE METHOTDS =====
  
  update(updateData: IUserUpdate): void {
    if (updateData.username !== undefined) {
      this.username = updateData.username;
    }
    if (updateData.email !== undefined) {
      this.email = updateData.email;
    }
    if (updateData.avatar !== undefined) {
      this.avatar = updateData.avatar;
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    this.password = newPassword;
    await this.hashPassword();
  }

  // ===== CONVERSION METHODS =====
  
  toPublic(): IUserPublic {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
      isOnline: this.isOnline,
      lastSeen: this.lastSeen,
      createdAt: this.createdAt
    };
  }

  toJSON(): IUser {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      password: this.password,
      avatar: this.avatar,
      isOnline: this.isOnline,
      lastSeen: this.lastSeen,
      createdAt: this.createdAt
    };
  }

  // ===== STATIC METHODS =====
  
  static async createFromRegister(registerData: IUserRegister): Promise<UserEntity> {
    const user = new UserEntity(registerData);
    await user.hashPassword();
    return user;
  }

  static fromDatabase(dbData: IUser): UserEntity {
    return new UserEntity(dbData);
  }

  // ===== UTILS METHODS =====
  
  getDisplayName(): string {
    return this.username || this.email.split('@')[0];
  }

  isRecentlyActive(minutesThreshold: number = 5): boolean {
    const threshold = new Date(Date.now() - minutesThreshold * 60 * 1000);
    return this.lastSeen > threshold;
  }

  equals(other: UserEntity): boolean {
    return this.id === other.id;
  }
}