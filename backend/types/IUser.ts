export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;  // Hash_PASSWORD
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

// This interface represents a user in the system.
// It includes fields for the user's ID, username, email, without password
export interface IUserPublic extends Omit<IUser, 'password'> {
}

export interface IUserUpdate {
  username?: string;
  email?: string;
  password?: string; // Hash_PASSWORD
  avatar?: string;
}

export interface IUserLogin {
  email: string;
  password: string; // Hash_PASSWORD
}

export interface IUserRegister {
  username: string;
  email: string;
  password: string; // Hash_PASSWORD
  avatar?: string;
}