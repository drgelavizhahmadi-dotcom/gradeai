import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session?.metadata?.userId) {
            return new NextResponse('User id is required', { status: 400 });
        }

        try {
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            ) as Stripe.Subscription;

            // Validate current_period_end before converting to Date
            const currentPeriodEnd = (subscription as any).current_period_end;
            const periodEndDate = currentPeriodEnd && typeof currentPeriodEnd === 'number'
                ? new Date(currentPeriodEnd * 1000)
                : null;

            await db.user.update({
                where: {
                    id: session.metadata.userId,
                },
                data: {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer as string,
                    stripePriceId: subscription.items.data[0].price.id,
                    ...(periodEndDate && { stripeCurrentPeriodEnd: periodEndDate }),
                    subscriptionStatus: 'premium',
                },
            });
        } catch (error) {
            console.error('[CHECKOUT_SESSION_COMPLETED_ERROR]', error);
            // Return 200 to acknowledge receipt even if update fails
            // Stripe will not retry, but invoice.payment_succeeded will handle the update
            return new NextResponse(null, { status: 200 });
        }
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice;

        if (!(invoice as any).subscription) {
            // This might happen for one-time payments, ignore if so or log
            return new NextResponse('No subscription found in invoice', { status: 200 });
        }

        try {
            const subscription = await stripe.subscriptions.retrieve(
                (invoice as any).subscription as string
            ) as Stripe.Subscription;

            // Robust user lookup with multiple fallback strategies
            // Try subscription ID first (most reliable if checkout.session.completed already ran)
            let user = await db.user.findFirst({
                where: {
                    OR: [
                        { stripeSubscriptionId: subscription.id },
                        { stripeCustomerId: subscription.customer as string },
                        { email: (invoice as any).customer_email as string },
                    ],
                },
            });

            if (!user) {
                console.error(`[INVOICE_PAYMENT_SUCCEEDED] User not found for subscription ${subscription.id}, customer ${subscription.customer}, email ${(invoice as any).customer_email}`);
                // Return 200 to acknowledge but user might not exist in our system
                return new NextResponse('User not found', { status: 200 });
            }

            // Validate current_period_end before converting to Date
            const currentPeriodEnd = (subscription as any).current_period_end;
            const periodEndDate = currentPeriodEnd && typeof currentPeriodEnd === 'number'
                ? new Date(currentPeriodEnd * 1000)
                : null;

            // Update user with all subscription details
            await db.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer as string,
                    stripePriceId: subscription.items.data[0].price.id,
                    ...(periodEndDate && { stripeCurrentPeriodEnd: periodEndDate }),
                    subscriptionStatus: 'premium',
                },
            });
        } catch (error) {
            console.error('[INVOICE_PAYMENT_SUCCEEDED_ERROR]', error);
            // Return 500 to trigger Stripe retry for this event
            return new NextResponse('Internal server error', { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}
