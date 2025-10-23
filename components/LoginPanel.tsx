import React, { useState, useId } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useEmailValidation } from './hooks/useEmailValidation';
import { MailIcon } from './icons/MailIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CheckIcon } from './icons/CheckIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

// Define the Supabase property and environment variables on the window object for TypeScript.
declare global {
  interface Window {
    supabase: any;
    ENV_SUPABASE_URL?: string;
    ENV_SUPABASE_ANON_KEY?: string;
  }
}

// ---- Config: where the magic link should send users back to (landing bridge) ----
const EMAIL_REDIRECT_TO = 'https://grc-public-landing.onrender.com/email-bridge';

// Safely get Supabase credentials from environment variables injected into the window object.
const SUPABASE_URL = typeof window !== 'undefined' ? window.ENV_SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof window !== 'undefined' ? window.ENV_SUPABASE_ANON_KEY : undefined;

// Initialize Supabase client once.
const { createClient } = (typeof window !== 'undefined' ? window.supabase : {}) || {};
const supabaseClient =
  (typeof window !== 'undefined' && createClient && SUPABASE_URL && SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // detectSessionInUrl should be true for magic-link handling on the landing site
          detectSessionInUrl: true,
        },
      })
    : null;

type FormState = 'idle' | 'loading' | 'success' | 'error';

const LoginPanel: React.FC = () => {
  const [formState, setFormState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');
  const { email, emailError, onChange, onBlur, validate, reset: resetEmail } = useEmailValidation();
  const errorId = useId();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate(email)) return;

    setFormState('loading');
    setMessage('');

    try {
      if (!supabaseClient) {
        throw new Error('Supabase client is not configured. Missing URL or Key.');
      }

      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: EMAIL_REDIRECT_TO, // <- key addition
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setFormState('success');
      setMessage(`Access link sent to ${email}! Check your inbox.`);
    } catch (error: any) {
      setFormState('error');
      setMessage(error?.message || 'Unable to send access link.');
    }
  };

  const resetForm = () => {
    setFormState('idle');
    setMessage('');
    resetEmail();
  };

  const renderContent = () => {
    switch (formState) {
      case 'success':
        return (
          <div className="mt-8 text-center py-4" role="status">
            <CheckIcon className="h-16 w-16 mx-auto text-green-500" />
            <p className="mt-4 text-slate-300">{message}</p>
            <Button onClick={resetForm} className="mt-6 bg-slate-700 hover:bg-slate-600 text-slate-200">
              Send another link
            </Button>
          </div>
        );
      case 'error':
        return (
          <div className="mt-8 text-center py-4" role="status">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-red-500" />
            <p className="mt-4 text-slate-300">{message}</p>
            <Button onClick={resetForm} className="mt-6 bg-slate-700 hover:bg-slate-600 text-slate-200">
              Try again
            </Button>
          </div>
        );
      case 'idle':
      case 'loading':
      default:
        return (
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <label htmlFor="login-email" className="text-sm font-medium text-slate-500 mb-1 block">
                Email Address
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={onChange}
                onBlur={onBlur}
                disabled={formState === 'loading'}
                icon={<MailIcon className="h-5 w-5 text-gray-400" />}
                isInvalid={!!emailError}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? errorId : undefined}
              />
              {emailError && (
                <p id={errorId} className="text-red-500 text-xs mt-2" aria-live="polite">
                  {emailError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200"
              disabled={formState === 'loading' || !!emailError}
            >
              {formState === 'loading' ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner className="h-5 w-5 mr-2" />
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Access Link'
              )}
            </Button>
          </form>
        );
    }
  };

  return (
    <Card className="bg-slate-900">
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-200">Course Login</h2>
        <p className="text-slate-500 mt-2">
          Already enrolled? We'll email you a magic link to access the course.
        </p>
        {renderContent()}
      </div>
    </Card>
  );
};

export default LoginPanel;
