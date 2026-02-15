import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useForgotPassword, useResetPassword } from '@/hooks/useAuth';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-danger-500', 'bg-amber-500', 'bg-primary-500', 'bg-success-500'];
  return {
    score,
    label: labels[Math.max(0, score - 1)] || 'Weak',
    color: colors[Math.max(0, score - 1)] || 'bg-danger-500',
  };
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  if (code) {
    return <ResetForm code={code} />;
  }
  return <ForgotForm />;
}

function ForgotForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const forgotMutation = useForgotPassword();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Email is required');
      return;
    }
    forgotMutation.mutate(email, {
      onError: (err: any) => {
        setError(err?.response?.data?.detail || 'Failed to send reset link');
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Shield size={32} className="text-primary-500" />
            <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">Jenga-AI</span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">Reset your password</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {forgotMutation.isSuccess ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="mx-auto text-success-500 mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Check your email</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  If an account with <strong>{email}</strong> exists, we've sent a password reset link.
                </p>
                <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <Input label="Email" type="email" icon={<Mail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                {error && <p className="text-sm text-danger-500">{error}</p>}
                <Button type="submit" className="w-full" loading={forgotMutation.isPending}>
                  Send reset link
                </Button>
                <p className="text-center">
                  <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResetForm({ code }: { code: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const resetMutation = useResetPassword();
  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    resetMutation.mutate(
      { code, newPassword },
      {
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          if (typeof detail === 'string') {
            setError(detail);
          } else if (Array.isArray(detail)) {
            setError(detail.map((d: any) => d.msg).join('. '));
          } else {
            setError('Reset failed');
          }
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Shield size={32} className="text-primary-500" />
            <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">Jenga-AI</span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">Set new password</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {resetMutation.isSuccess ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="mx-auto text-success-500 mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Password reset!</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  Your password has been updated. You can now sign in.
                </p>
                <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Go to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input label="New Password" type="password" icon={<Lock size={16} />} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-surface-200 dark:bg-surface-700'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-surface-500 mt-1">{strength.label}</p>
                    </div>
                  )}
                </div>
                <Input label="Confirm Password" type="password" icon={<Lock size={16} />} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
                {error && <p className="text-sm text-danger-500">{error}</p>}
                <Button type="submit" className="w-full" loading={resetMutation.isPending}>
                  Reset password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
