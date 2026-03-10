import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Find the token in the database
        const verificationToken = await db.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        // Check if token has expired
        if (new Date() > verificationToken.expires) {
            // Clean up expired token
            await db.verificationToken.delete({
                where: { token },
            });
            return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
        }

        // Mark the user as verified
        await db.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        // Delete the token after successful verification
        await db.verificationToken.delete({
            where: { token },
        });

        return NextResponse.json({
            success: true,
            message: 'Email successfully verified',
        });
    } catch (error) {
        console.error('[Verify Email API] Error:', error);
        return NextResponse.json(
            { error: 'An error occurred during verification' },
            { status: 500 }
        );
    }
}
