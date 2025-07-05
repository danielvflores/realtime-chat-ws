export interface IAuth {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      avatar?: string;
      isOnline: boolean;
    };
    token: string;
    expiresIn: string;
  };
  error?: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    username: string;
    email: string;
  };
  error?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
      };
    }
  }
}
