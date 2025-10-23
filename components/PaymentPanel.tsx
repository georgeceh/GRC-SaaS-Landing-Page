import React, { useState, useId } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useEmailValidation } from './hooks/useEmailValidation';
import { MailIcon } from './icons/MailIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

declare global {
  interface Window {
    Stripe: any;
    ENV_STRIPE_PUBLISHABLE_KEY?: string;
    ENV_API_BASE?: string;
  }
}

const API_BASE = window.ENV_API_BASE || "";

// Safely get Stripe key from environment variables injected into the window object.
const STRIPE_PUBLISHABLE_KEY = window.ENV_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe once.
const stripe = (typeof window !== 'undefined' && window.Stripe && STRIPE_PUBLISHABLE_KEY) 
  ? window.Stripe(STRIPE_PUBLISHABLE_KEY) 
  : null;

type FormState = 'idle' | 'loading' | 'error';

const PaymentPanel: React.FC = () => {
    const { email, emailError, onChange, onBlur, validate } = useEmailValidation();
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const errorId = useId();

    const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');
        if (!validate(email)) {
            return;
        }
        setFormState('loading');

        try {
            if (!stripe) {
                throw new Error('Stripe is not configured. Missing publishable key.');
            }

            const res = await fetch(`${API_BASE}/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to create session.');

            await stripe.redirectToCheckout({ sessionId: json.sessionId });
        } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
            setFormState('error');
        }
    };
    
    const renderContent = () => {
        if (formState === 'error') {
            return (
                <div className="mt-8 text-center py-4" role="status">
                    <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-red-500" />
                    <p className="mt-4 text-slate-300">{errorMessage}</p>
                    <Button onClick={() => setFormState('idle')} className="mt-6 w-full bg-[#22c55e] hover:brightness-105 text-white font-bold">
                        Try again
                    </Button>
                </div>
            )
        }
        
        return (
            <>
                 <form onSubmit={handlePayment} className="space-y-6 mt-8">
                    <div>
                        <label htmlFor="pay-email" className="text-sm font-medium text-slate-500 mb-1 block">Your Email for Enrollment</label>
                        <Input
                            id="pay-email"
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
                         {emailError && <p id={errorId} className="text-red-500 text-xs mt-2" aria-live="polite">{emailError}</p>}
                    </div>
                    <Button type="submit" className="w-full bg-[#22c55e] hover:brightness-105 text-white font-bold" disabled={formState === 'loading' || !!emailError}>
                        {formState === 'loading' ? (
                            <div className="flex items-center justify-center">
                                <LoadingSpinner className="h-5 w-5 mr-2 text-white"/>
                                <span>Redirecting...</span>
                            </div>
                        ) : 'Pay A$249 & Enroll Now'}
                    </Button>
                </form>

                 <div className="mt-6 text-xs text-slate-400 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    After payment, check your email for a magic link to access the course instantly.
                </div>
            </>
        )
    }

    const features = [
        "Full access to course materials",
        "Comprehensive GRC curriculum",
        "Hands-on AI integration projects",
        "Interactive lessons, quizzes & real-world scenarios",
        "covers enterprise risk (COSO, ISO 31000), cybersecurity (NIST, ISO 27001), IT governance (COBIT, ITIL), and key regulations (GDPR, SOX, PCI DSS) for an integrated program.",
        "Official Certificate of Completion"
    ];

    return (
        <Card className="bg-slate-900">
            <div className="p-8">
                <h2 className="text-3xl font-bold text-slate-200">Enroll in Short Course</h2>
                <p className="text-slate-400 mt-3 text-center">Full access for a one-time payment.</p>

                <div className="my-6 text-slate-300">
                    <p className="font-semibold text-slate-400 mb-4">Here's what you'll get:</p>
                    <ul className="space-y-3 text-sm">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                                <CheckIcon className="h-5 w-5 mr-3 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {renderContent()}
            </div>
        </Card>
    );
};

export default PaymentPanel;
