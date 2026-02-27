import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        // Find the token
        const verificationToken = await db.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        // Check expiry
        if (new Date() > verificationToken.expires) {
            await db.verificationToken.delete({ where: { token } });
            return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await hashPassword(password);

        // Update user password and mark as verified if they weren't (since they have email access)
        await db.user.update({
            where: { email: verificationToken.identifier },
            data: {
                hashedPassword,
                emailVerified: new Date()
            },
        });

        // Delete the token
        await db.verificationToken.delete({
            where: { token },
        });

        return NextResponse.json({
            success: true,
            message: 'Passwort erfolgreich zurückgesetzt.',
        });
    } catch (error) {
        console.error('[Reset Password API] Error:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten.' },
            { status: 500 }
        );
    }
}
