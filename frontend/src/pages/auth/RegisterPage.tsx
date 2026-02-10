import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User } from 'lucide-react';
import { Input } from '@/components/ui/Input.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useAuthStore } from '@/store/auth-store.ts';
import { register } from '@/api/auth.ts';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-danger-500', 'bg-amber-500', 'bg-primary-500', 'bg-success-500'];
  return { score, label: labels[Math.max(0, score - 1)] || 'Weak', color: colors[Math.max(0, score - 1)] || 'bg-danger-500' };
}

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((s) => s.login);
  const navigate = useNavigate();

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
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await register({ fullName, email, password, confirmPassword });
      loginStore(res.user, res.tokens);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
              <Button type="submit" className="w-full" loading={loading}>
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
