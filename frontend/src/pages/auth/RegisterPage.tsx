import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useRegister, useResendVerification } from '@/hooks/useAuth';

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

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const registerMutation = useRegister();
  const resendMutation = useResendVerification();
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    registerMutation.mutate(
      { fullName, email, password },
      {
        onSuccess: () => setRegistered(true),
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          if (typeof detail === 'string') {
            setError(detail);
          } else if (Array.isArray(detail)) {
            setError(detail.map((d: any) => d.msg).join('. '));
          } else {
            setError('Registration failed');
          }
        },
      },
    );
  };

  const handleResend = () => {
    resendMutation.mutate(email);
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <Shield size={32} className="text-primary-500" />
              <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">Jenga-AI</span>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <CheckCircle size={48} className="mx-auto text-success-500 mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  Verify your email
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  We sent a verification link to <strong>{email}</strong>. Check your inbox and click the link to activate your account.
                </p>
                <Button
                  onClick={handleResend}
                  loading={resendMutation.isPending}
                  className="mb-4"
                >
                  Resend verification email
                </Button>
                {resendMutation.isSuccess && (
                  <p className="text-sm text-success-500">Verification email resent!</p>
                )}
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-4">
                  Already verified?{' '}
                  <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Shield size={32} className="text-primary-500" />
            <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">Jenga-AI</span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">Create your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" icon={<User size={16} />} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Amina Wanjiku" />
              <Input label="Email" type="email" icon={<Mail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <div>
                <Input label="Password" type="password" icon={<Lock size={16} />} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
                {password && (
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
              <Button type="submit" className="w-full" loading={registerMutation.isPending}>
                Create account
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-surface-500 dark:text-surface-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
