import React, { useState, useEffect } from 'react';
import LoginPanel from './components/LoginPanel';
import PaymentPanel from './components/PaymentPanel';
import Card from './components/ui/Card';
import { LoadingSpinner } from './components/icons/LoadingSpinner';

// Safely get all required environment variables and the global Supabase object from the window object.
declare global {
  interface Window {
    ENV_API_BASE?: string;
    // Added Supabase declarations for the new listener logic
    supabase?: any; 
    ENV_SUPABASE_URL?: string;
    ENV_SUPABASE_ANON_KEY?: string;
  }
}
const API_BASE = window.ENV_API_BASE || "";

type CheckoutStatus = 'idle' | 'validating' | 'success' | 'error';

function App() {
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  // 1. Existing useEffect for post-checkout validation (Stripe redirect)
  useEffect(() => {
    const handlePostCheckout = async () => {
      const u = new URL(window.location.href);
      const sessionId = u.searchParams.get('session_id');
      if (!sessionId) return;

      setCheckoutStatus('validating');
      setCheckoutMessage('Validating your payment and granting access…');
      
      // Clear query params from URL
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
        setCheckoutMessage(e.message || 'Something went wrong finalizing your access. Contact support.');
      }
    };

    handlePostCheckout();
  }, []);
  
  // 2. NEW useEffect for Supabase Login Redirection (Magic Link click)
  useEffect(() => {
    const courseDashboardUrl = 'https://dashboard.render.com/static/srv-d3r1cfm3jp1c738v12qg';
    
    // Check if the Supabase client is loaded globally
    if (window.supabase) {
      const SUPABASE_URL = window.ENV_SUPABASE_URL;
      const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY;
      const { createClient } = window.supabase;

      // Initialize client only if environment variables are available
      if (createClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Listen for authentication state changes (this triggers when user clicks magic link)
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          (event, session) => {
            // Check for a successful session and the signed-in event
            if (session && event === 'SIGNED_IN') {
              // Redirect to the GRC Course Static Site
              window.location.href = courseDashboardUrl;
            }
          }
        );
        
        // Clean up the subscription when the component unmounts
        return () => {
          subscription?.unsubscribe();
        };
      }
    }
  }, []); // Run only once on mount

  const renderContent = () => {
    if (checkoutStatus !== 'idle') {
      return (
        <Card className="bg-slate-900">
          <div className="p-8 text-center" role="status">
            <h2 className="text-2xl font-bold text-slate-200">Finishing up...</h2>
            {checkoutStatus === 'validating' && <LoadingSpinner className="h-8 w-8 mx-auto my-4 text-slate-400" />}
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
          <p className="mt-4 text-lg text-slate-400">
            Online • Self-paced • Certificate Course
          </p>
        </header>
        
        <main>
          <Card className="mb-8 bg-blue-600 border-blue-500">
            <div className="p-6">
              <p className="font-semibold text-white">For Cybersecurity, IT, and Business Leaders</p>
              <p className="mt-2 text-sm text-blue-100">Unlock the strategic power of GRC and become board-ready in just days, not months.</p>
            </div>
          </Card>
          
          {renderContent()}
        </main>
        
        <footer className="text-center text-slate-500 text-sm py-8">
          © 2026 Elala pty ltd
        </footer>
      </div>
    </div>
  );
}

export default App;
