import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { resetPassword } from '@/api/auth.ts';

export function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
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
          <p className="text-sm text-surface-500 dark:text-surface-400">Reset your password</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="mx-auto text-success-500 mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Check your email</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  We sent a password reset link to <strong>{email}</strong>
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
                <Button type="submit" className="w-full" loading={loading}>
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
