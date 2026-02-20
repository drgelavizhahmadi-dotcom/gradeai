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
        const stripesession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${appUrl}/dashboard/subscription`,
        });

        return NextResponse.json({ url: stripesession.url });
    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
