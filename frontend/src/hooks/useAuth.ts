import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/auth-store';

// ── Types ────────────────────────────────────────────

type LoginRequest = { email: string; password: string };
type RegisterRequest = { email: string; password: string; fullName: string };
type ResetPasswordRequest = { code: string; newPassword: string };

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

type UserResponse = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
};

type MessageResponse = { message: string };

// ── API functions ────────────────────────────────────

const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<UserResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
    }).then((r) => r.data),

  getMe: () =>
    apiClient.get<UserResponse>('/auth/me').then((r) => r.data),

  updateProfile: (data: { fullName?: string; email?: string }) =>
    apiClient.put<UserResponse>('/auth/me', {
      full_name: data.fullName,
      email: data.email,
    }).then((r) => r.data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<TokenResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<MessageResponse>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<MessageResponse>('/auth/reset-password', { code: data.code, new_password: data.newPassword }).then((r) => r.data),

  verifyEmail: (code: string) =>
    apiClient.post<MessageResponse>(`/auth/verify-email?code=${code}`).then((r) => r.data),

  resendVerification: (email: string) =>
    apiClient.post<MessageResponse>('/auth/resend-verification', { email }).then((r) => r.data),
};

// ── Hooks ────────────────────────────────────────────

/** Fetch current session / user profile */
export function useSession() {
  const { tokens, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['session'],
    queryFn: authApi.getMe,
    enabled: isAuthenticated && !!tokens?.accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/** Login mutation */
export function useLogin() {
  const { login: storeLogin } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (tokens) => {
      storeLogin(
        { id: '', email: '', fullName: '', createdAt: '' } as any,
        { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      );
      try {
        const user = await authApi.getMe();
        storeLogin(
          {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            createdAt: user.createdAt,
          },
          { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
        );
        queryClient.setQueryData(['session'], user);
      } catch {
      }
    },
  });
}

/** Register mutation */
export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

/** Forgot password mutation */
export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
}

/** Reset password mutation */
export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  });
}

/** Verify email mutation */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: authApi.verifyEmail,
  });
}

/** Resend verification email mutation */
export function useResendVerification() {
  return useMutation({
    mutationFn: authApi.resendVerification,
  });
}

/** Update profile mutation */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user);
    },
  });
}

/** Logout — clears store and cache */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
  };
}
