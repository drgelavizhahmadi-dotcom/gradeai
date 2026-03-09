import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import {
    passwordResetRateLimiter,
    getClientIP,
    isLocalhost,
    rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request);
        if (!isLocalhost(clientIP) || process.env.NODE_ENV === 'production') {
            const rateLimitResult = passwordResetRateLimiter.check(clientIP);
            if (!rateLimitResult.success) {
                return rateLimitResponse(rateLimitResult.retryAfter);
            }
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user
        const user = await db.user.findUnique({
            where: { email },
        });

        // To prevent email enumeration, we return success even if the user doesn't exist
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet.',
            });
        }

        // If user is a Google OAuth user (no password), we don't send a reset link
        if (!user.hashedPassword) {
            return NextResponse.json({
                success: true,
                message: 'Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet.',
            });
        }

        // Generate reset token
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        // Save token to DB (using the same table as verification)
        await db.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } },
            update: { token, expires }, // This shouldn't really happen with random UUID
            create: {
                identifier: email,
                token,
                expires,
            },
        });

        // Send email
        try {
            await sendPasswordResetEmail(email, token, user.name || 'User');
        } catch (emailError) {
            console.error('[Forgot Password API] Email error:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: 'Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet.',
        });
    } catch (error) {
        console.error('[Forgot Password API] Error:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten.' },
            { status: 500 }
        );
    }
}
