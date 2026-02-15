import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import axios from 'axios';
import { apiClient } from '@/api/client';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-code'>(
    code ? 'loading' : 'no-code'
  );
  const calledRef = useRef(false);

  useEffect(() => {
    if (code && !calledRef.current) {
      calledRef.current = true;
      
      axios
        .post(`${apiClient.defaults.baseURL}/verify-email?code=${code}`)
        .then((res) => {
          setStatus('success');
        })
        .catch((err) => {
          setStatus('error');
        });
    }
  }, [code]);

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
              {status === 'loading' && (
                <>
                  <Loader2 size={48} className="mx-auto text-primary-500 mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    Verifying your email...
                  </h3>
                </>
              )}

              {status === 'success' && (
                <>
                  <CheckCircle size={48} className="mx-auto text-success-500 mb-4" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    Email verified!
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                    Your account is now active. You can sign in.
                  </p>
                  <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    Go to sign in
                  </Link>
                </>
              )}

              {status === 'error' && (
                <>
                  <XCircle size={48} className="mx-auto text-danger-500 mb-4" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    Verification failed
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                    This link may have expired or already been used.
                  </p>
                  <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    Back to sign in
                  </Link>
                </>
              )}

              {status === 'no-code' && (
                <>
                  <XCircle size={48} className="mx-auto text-danger-500 mb-4" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    Missing verification code
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                    Please use the link from your verification email.
                  </p>
                  <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    Back to sign in
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
