import nodemailer from 'nodemailer';

/**
 * Create a nodemailer transporter using SMTP settings from environment variables
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
};

const FROM_EMAIL = process.env.EMAIL_FROM || 'GradeAI <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send a verification email to a new user
 */
export async function sendVerificationEmail(email: string, token: string, name: string) {
    const transporter = createTransporter();
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: 'Verifiziere deine E-Mail-Adresse - GradeAI',
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
        <h2 style="color: #6366f1;">Willkommen bei GradeAI, ${name}!</h2>
        <p>Vielen Dank für deine Registrierung. Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren:</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">E-Mail verifizieren</a>
        </div>
        <p style="color: #666; font-size: 14px;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Falls du dieses Konto nicht erstellt hast, kannst du diese E-Mail ignorieren.</p>
      </div>
    `,
    });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string, name: string) {
    const transporter = createTransporter();
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: 'Passwort zurücksetzen - GradeAI',
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
        <h2 style="color: #6366f1;">Passwort zurücksetzen</h2>
        <p>Hallo ${name},</p>
        <p>wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke auf den folgenden Button, um ein neues Passwort festzulegen:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Passwort zurücksetzen</a>
        </div>
        <p style="color: #666; font-size: 14px;">Dieser Link ist 1 Stunde lang gültig. Falls du keine Anfrage gestellt hast, kannst du diese E-Mail ignorieren.</p>
        <p style="color: #666; font-size: 14px;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">GradeAI Lernbegleiter</p>
      </div>
    `,
    });
}
