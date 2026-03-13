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

        if (!user.email) {
            return new NextResponse('Email required for payment', { status: 400 });
        }

        let stripeCustomerId = (user as any).stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                ...(user.name ? { name: user.name } : {}),
                metadata: {
                    userId: user.id,
                },
            });

            stripeCustomerId = customer.id;

            await db.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    stripeCustomerId: customer.id,
                } as any,
            });
        }

        if (!process.env.STRIPE_PREMIUM_PRICE_ID) {
            return new NextResponse('Stripe Price ID is missing', { status: 500 });
        }

        const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const successUrl = new URL('/dashboard/subscription?success=true', nextAuthUrl).toString();
        const cancelUrl = new URL('/dashboard/subscription?canceled=true', nextAuthUrl).toString();

        console.log(`[CHECKOUT] Creating session with successUrl: ${successUrl}`);

        const stripeSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            client_reference_id: user.id,
            billing_address_collection: 'auto',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PREMIUM_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: user.id,
            },
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error: any) {
        console.error('[STRIPE_ERROR] Failed to create checkout session:', error);

        // Log more details if it's a Stripe error
        if (error.type === 'StripeError') {
            console.error('[STRIPE_ERROR_DETAILS]:', {
                message: error.message,
                param: error.param,
                code: error.code,
                type: error.type
            });
        }

        return new NextResponse('Internal Error', { status: 500 });
    }
}
