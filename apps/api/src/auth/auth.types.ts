export interface JwtPayload {
  sub: string;
  isGuest: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  username: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}
