'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionButtonProps {
    isPremium: boolean;
    hasEmail: boolean;
}

export const SubscriptionButton = ({ isPremium, hasEmail }: SubscriptionButtonProps) => {
    const [loading, setLoading] = useState(false);
    const [showEmailError, setShowEmailError] = useState(false);
    const router = useRouter();

    const handleSubscribe = async () => {
        if (!hasEmail) {
            setShowEmailError(true);
            setTimeout(() => {
                router.push('/dashboard/settings');
            }, 3000);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(isPremium ? '/api/stripe/portal' : '/api/stripe/checkout', {
                method: 'POST',
            });

            if (!response.ok) {
                const text = await response.text();
                if (response.status === 400 && text === 'Email required for payment') {
                    setShowEmailError(true);
                    setTimeout(() => router.push('/dashboard/settings'), 3000);
                    return;
                }
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            window.location.href = data.url;
        } catch (error) {
            console.error('Something went wrong', error);
        } finally {
            setLoading(false);
        }
    };

    if (isPremium) {
        return (
            <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 shadow-sm transition-colors"
            >
                {loading ? 'Processing...' : 'Manage Subscription'}
            </button>
        );
    }

    return (
        <div className="w-full space-y-2">
            <button
                onClick={handleSubscribe}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Processing...' : 'Upgrade to Premium'}
            </button>
            {showEmailError && (
                <p className="text-sm text-red-500 text-center animate-pulse">
                    Please add an email in your profile settings before upgrading. Redirecting...
                </p>
            )}
        </div>
    );
};
