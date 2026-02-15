import { UserRole } from './common';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  city: string | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerStats {
  id: string;
  userId: string;
  totalSales: number;
  totalListings: number;
  commissionFreeRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email?: string;
  phone?: string;
  password: string;
  name: string;
  city?: string;
  region?: string;
}

export interface LoginDto {
  emailOrPhone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
