import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/index.ts';
import { delay, mockUser } from '@/lib/mock-data.ts';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  await delay(800);
  if (data.email === 'analyst@jenga.ai' && data.password === 'password') {
    return {
      user: mockUser,
      tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' },
    };
  }
  throw new Error('Invalid email or password');
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  await delay(800);
  return {
    user: { ...mockUser, id: 'usr_new', email: data.email, fullName: data.fullName },
    tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' },
  };
}

export async function resetPassword(email: string): Promise<{ message: string }> {
  await delay(600);
  return { message: `Password reset link sent to ${email}` };
}
