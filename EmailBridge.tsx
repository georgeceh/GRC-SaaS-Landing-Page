// src/EmailBridge.tsx  (Landing app)
import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

const LANDING_ORIGIN = 'https://grc-public-landing.onrender.com';
const COURSE_APP_URL = 'https://grc-course.onrender.com';

const ALLOWED_ORIGINS = new Set<string>([
  LANDING_ORIGIN,
  new URL(import.meta.env.VITE_SUPABASE_URL!).origin,
]);

function isAllowed(url: string) {
  try { return ALLOWED_ORIGINS.has(new URL(url).origin); }
  catch { return false; }
}

export default function EmailBridge() {
  const [msg, setMsg] = useState('Verifying your session…');

  const continueUrl = useMemo(() => {
    const qs = new URLSearchParams(window.location.search);
    const raw = qs.get('u') || qs.get('confirmation_url');
    return raw ? decodeURIComponent(raw) : '';
  }, []);

  useEffect(() => {
    let redirected = false;
    const go = (href: string) => {
      if (!redirected) {
        redirected = true;
        window.location.replace(href);
      }
    };

    // Legacy allowed continue
    if (continueUrl) {
      if (isAllowed(continueUrl)) {
        setMsg('Continuing…');
        const t = setTimeout(() => go(continueUrl), 100);
        return () => clearTimeout(t);
      } else {
        setMsg('Blocked: untrusted continue URL.');
        return;
      }
    }

    const hash = window.location.hash ?? '';
    const hasAccessToken = /access_token=/.test(hash);
    const typeParam = (hash.match(/type=([^&]+)/)?.[1] || '').toLowerCase();

    const run = async () => {
      // Password reset flow
      if (typeParam === 'recovery') {
        setMsg('Opening password reset…');
        go('/reset-password');
        return;
      }

      // Signed-in check (SDK parses hash because detectSessionInUrl: true)
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setMsg('Redirecting to your course…');
        go(COURSE_APP_URL);
        return;
      }

      // Wait for auth event as fallback
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (session?.user) {
          setMsg('Redirecting to your course…');
          go(COURSE_APP_URL);
        }
      });

      const timeout = setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setMsg('Redirecting to your course…');
          go(COURSE_APP_URL);
        } else {
          setMsg('Still verifying…');
        }
      }, 2000);

      return () => {
        clearTimeout(timeout);
        sub?.subscription?.unsubscribe?.();
      };
    };

    if (hasAccessToken || typeParam) {
      const cleanup = run();
      return () => { (async () => (await cleanup)?.())(); };
    } else {
      // No hash—maybe already signed in
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) go(COURSE_APP_URL);
        else setMsg('No session found. You can close this tab.');
      });
    }
  }, [continueUrl]);

  return (
    <div className="min-h-screen grid place-items-center bg-slate-900 text-slate-200 p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-slate-200" />
        <h1 className="text-xl font-semibold">{msg}</h1>
        <p className="mt-2 text-slate-400">If this takes more than a few seconds, check your inbox again.</p>
      </div>
    </div>
  );
}
