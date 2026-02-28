import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(_req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || !session?.user.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const user = await db.user.findUnique({
            where: {
                email: session.user.email,
            },
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        if (!user.stripeCustomerId) {
            return new NextResponse('User does not have a stripe customer id', {
                status: 400,
            });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const returnUrl = `${appUrl}/dashboard/subscription`;
        console.log('[STRIPE_PORTAL_DEBUG] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
        console.log('[STRIPE_PORTAL_DEBUG] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
        console.log('[STRIPE_PORTAL_DEBUG] STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ set' : '❌ missing');
        console.log('[STRIPE_PORTAL_DEBUG] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ set' : '❌ missing');
        console.log('[STRIPE_PORTAL_DEBUG] STRIPE_PREMIUM_PRICE_ID:', process.env.STRIPE_PREMIUM_PRICE_ID);
        console.log('[STRIPE_PORTAL_DEBUG] STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ set' : '❌ missing');
        console.log('[STRIPE_PORTAL_DEBUG] appUrl (resolved):', appUrl);
        console.log('[STRIPE_PORTAL_DEBUG] return_url:', returnUrl);
        const stripesession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: returnUrl,
        });

        return NextResponse.json({ url: stripesession.url });
    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
