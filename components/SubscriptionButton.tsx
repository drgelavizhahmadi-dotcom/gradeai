'use client';

import { useState } from 'react';

interface SubscriptionButtonProps {
    isPremium: boolean;
}

export const SubscriptionButton = ({ isPremium }: SubscriptionButtonProps) => {
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        try {
            setLoading(true);
            const response = await fetch(isPremium ? '/api/stripe/portal' : '/api/stripe/checkout', {
                method: 'POST',
            });

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
        <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? 'Processing...' : 'Upgrade to Premium'}
        </button>
    );
};
