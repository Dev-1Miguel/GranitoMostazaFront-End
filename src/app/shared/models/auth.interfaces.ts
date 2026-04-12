export interface LoginPayload {
  email: string;
  password: string;
  rememberSession: boolean;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  wantsPromotions: boolean;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "customer";
  };
}
