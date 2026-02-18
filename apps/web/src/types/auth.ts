export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  city: string | null;
  region: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}
