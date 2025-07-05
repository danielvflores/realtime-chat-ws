import database from '../database';
import { IUser, IUserRegister, IUserUpdate, IUserPublic } from '../../types/IUser';
import { UserEntity } from '../../entities/User';

export class UserRepository {
  
  // ===== FIND METHODS =====
  
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await database.get<IUser>('SELECT * FROM users WHERE id = ?', [id]);
      
      if (!user) {
        return null;
      }
      
      return UserEntity.fromDatabase(user);
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await database.get<IUser>('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        return null;
      }
      
      return UserEntity.fromDatabase(user);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    try {
      const user = await database.get<IUser>('SELECT * FROM users WHERE username = ?', [username]);
      
      if (!user) {
        return null;
      }
      
      return UserEntity.fromDatabase(user);
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    try {
      const users = await database.all<IUser>('SELECT * FROM users ORDER BY createdAt DESC');
      
      return users.map(user => UserEntity.fromDatabase(user));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  // ===== CREATE METHODS =====
  
  async create(userData: IUserRegister): Promise<UserEntity> {
    try {
      const userEntity = await UserEntity.createFromRegister(userData);
  
      await database.run(
        `INSERT INTO users (id, username, email, password, avatar, isOnline, lastSeen, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userEntity.id,
          userEntity.username,
          userEntity.email,
          userEntity.password,
          userEntity.avatar || null,
          userEntity.isOnline ? 1 : 0,
          userEntity.lastSeen.toISOString(),
          userEntity.createdAt.toISOString()
        ]
      );
      
      return userEntity;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // ===== UPDATE METHODS =====
  
  async update(id: string, updateData: IUserUpdate): Promise<UserEntity | null> {
    try {
      const existingUser = await this.findById(id);

      if (!existingUser) {
        return null;
      }

      existingUser.update(updateData);
      
      if (updateData.password) {
        await existingUser.updatePassword(updateData.password);
      }

      await database.run(
        `UPDATE users 
         SET username = ?, email = ?, password = ?, avatar = ?
         WHERE id = ?`,
        [
          existingUser.username,
          existingUser.email,
          existingUser.password,
          existingUser.avatar || null,
          id
        ]
      );

      return existingUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<UserEntity | null> {
    try {
      const user = await this.findById(id);
      if (!user) {
        return null;
      }

      if (isOnline) {
        user.setOnline();
      } else {
        user.setOffline();
      }

      await database.run(
        `UPDATE users 
         SET isOnline = ?, lastSeen = ?
         WHERE id = ?`,
        [
          user.isOnline ? 1 : 0,
          user.lastSeen.toISOString(),
          id
        ]
      );

      return user;
    } catch (error) {
      console.error('Error updating user online status:', error);
      throw error;
    }
  }

  // ===== DELETE METHODS =====
  
  async delete(id: string): Promise<boolean> {
    try {
      await database.run('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  
  async exists(email: string): Promise<boolean> {
    try {
      const user = await database.get('SELECT id FROM users WHERE email = ?', [email]);
      return !!user;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const result = await database.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  async findOnlineUsers(): Promise<UserEntity[]> {
    try {
      const users = await database.all<IUser>('SELECT * FROM users WHERE isOnline = 1 ORDER BY lastSeen DESC');
      return users.map(user => UserEntity.fromDatabase(user));
    } catch (error) {
      console.error('Error finding online users:', error);
      throw error;
    }
  }
}

// Singleton instance
const userRepository = new UserRepository();
export default userRepository;
