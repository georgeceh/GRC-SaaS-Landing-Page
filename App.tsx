import React, { useState, useEffect } from 'react';
import LoginPanel from './components/LoginPanel';
import PaymentPanel from './components/PaymentPanel';
import Card from './components/ui/Card';
import { LoadingSpinner } from './components/icons/LoadingSpinner';
import { supabase } from './supabaseClient';

// ------- Landing/Course URLs (decoupled Render services) -------
const LANDING_ORIGIN = 'https://grc-public-landing.onrender.com';
const COURSE_APP_URL = 'https://grc-course.onrender.com';

// Safely get the API base URL from environment variables injected into the window object.
declare global {
  interface Window {
    ENV_API_BASE?: string;
  }
}
const API_BASE = window.ENV_API_BASE || '';

type CheckoutStatus = 'idle' | 'validating' | 'success' | 'error';

function App() {
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  // --- Auth bridge: if user is (or becomes) signed in on the LANDING origin, redirect to COURSE immediately.
  useEffect(() => {
    const maybeRedirectToCourse = () => {
      if (typeof window === 'undefined') return;
      if (window.location.origin !== LANDING_ORIGIN) return; // safety: only redirect on the landing app
      window.location.replace(COURSE_APP_URL);
    };

    // 1) Check current session on load (covers: user clicks Supabase magic link → returns here already signed in)
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          maybeRedirectToCourse();
        }
      } catch {
        // no-op
      }
    })();

    // 2) Listen for live auth changes (covers: SDK establishes session after parsing URL hash)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        maybeRedirectToCourse();
      }
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // --- Stripe return handler: validate payment and trigger magic link email (UI feedback on the landing page)
  useEffect(() => {
    const handlePostCheckout = async () => {
      const u = new URL(window.location.href);
      const sessionId = u.searchParams.get('session_id');
      if (!sessionId) return;

      setCheckoutStatus('validating');
      setCheckoutMessage('Validating your payment and granting access…');

      // Clear query params from URL (cosmetic)
      window.history.replaceState(null, '', window.location.pathname);

      try {
        const res = await fetch(`${API_BASE}/confirm-access?session_id=${encodeURIComponent(sessionId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to confirm access.');

        setCheckoutStatus('success');
        setCheckoutMessage("You're all set! We just emailed you a magic login link. Check your inbox.");
      } catch (e: any) {
        console.error(e);
        setCheckoutStatus('error');
        setCheckoutMessage(e?.message || 'Something went wrong finalizing your access. Contact support.');
      }
    };

    handlePostCheckout();
  }, []);

  const renderContent = () => {
    if (checkoutStatus !== 'idle') {
      return (
        <Card className="bg-slate-900">
          <div className="p-8 text-center" role="status">
            <h2 className="text-2xl font-bold text-slate-200">Finishing up...</h2>
            {checkoutStatus === 'validating' && (
              <LoadingSpinner className="h-8 w-8 mx-auto my-4 text-slate-400" />
            )}
            <p className="text-slate-400 mt-4">{checkoutMessage}</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <LoginPanel />
        <PaymentPanel />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
            Governance, Risk, and Compliance (GRC)
          </h1>
          <p className="mt-4 text-lg text-slate-400">Online • Self-paced • Certificate Course</p>
        </header>

        <main>
          <Card className="mb-8 bg-blue-600 border-blue-500">
            <div className="p-6">
              <p className="font-semibold text-white">For Cybersecurity, IT, and Business Leaders</p>
              <p className="mt-2 text-sm text-blue-100">
                Unlock the strategic power of GRC and become board-ready in just days, not months.
              </p>
            </div>
          </Card>

          {renderContent()}
        </main>

        <footer className="text-center text-slate-500 text-sm py-8">© 2026 Elala pty ltd</footer>
      </div>
    </div>
  );
}

export default App;
