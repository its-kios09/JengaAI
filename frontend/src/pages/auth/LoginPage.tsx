import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useLogin, useResendVerification } from '@/hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const resendMutation = useResendVerification();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => navigate('/dashboard'),
        onError: (err: any) => {
          const message = err?.response?.data?.detail || err.message || 'Login failed';
          if (message.toLowerCase().includes('verify')) {
            setNeedsVerification(true);
          }
          setError(message);
        },
      },
    );
  };

  const handleResend = () => {
    resendMutation.mutate(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Shield size={32} className="text-primary-500" />
            <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">Jenga-AI</span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">National Security NLP Platform</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-6">Sign in to your account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-danger-500">{error}</p>
                  {needsVerification && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                        Check your inbox for a verification email.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResend}
                        loading={resendMutation.isPending}
                      >
                        Resend verification email
                      </Button>
                      {resendMutation.isSuccess && (
                        <p className="text-xs text-success-500 mt-1">Verification email resent!</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" loading={loginMutation.isPending}>
                Sign in
              </Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <Link to="/reset-password" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Forgot password?
              </Link>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                No account?{' '}
                <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
