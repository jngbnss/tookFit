import { api } from "./client";
import type {
  ChangePasswordRequest,
  LoginRequest,
  Me,
  PasswordResetConfirm,
  PasswordResetRequest,
  SignupRequest,
  UpdateMeRequest,
} from "./types";

export const authApi = {
  signup: (body: SignupRequest) => api.post<Me>("/auth/signup", body),
  login: (body: LoginRequest) => api.post<Me>("/auth/login", body),
  logout: () => api.post<void>("/auth/logout"),
  requestPasswordReset: (body: PasswordResetRequest) => api.post<void>("/auth/password/reset-request", body),
  resetPassword: (body: PasswordResetConfirm) => api.post<void>("/auth/password/reset", body),
  me: () => api.get<Me>("/me"),
  updateMe: (body: UpdateMeRequest) => api.patch<Me>("/me", body),
  changePassword: (body: ChangePasswordRequest) => api.patch<void>("/me/password", body),
  withdraw: () => api.delete<void>("/me"),
};

/** 소셜 로그인 시작 주소. fetch가 아니라 페이지 이동으로 연다. */
export function socialLoginUrl(provider: "KAKAO" | "NAVER", redirect = "/") {
  return `/oauth2/authorization/${provider.toLowerCase()}?redirect=${encodeURIComponent(redirect)}`;
}
