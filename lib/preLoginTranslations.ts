/**
 * Pre-login page translations (Landing, Login, Signup)
 * Languages: German (primary) and English
 */

import { useLanguage } from '@/components/providers/LanguageProvider'

type PreLoginLang = 'de' | 'en'

interface PreLoginTranslations {
    landing: {
        mascotMessage: string
        headline: string
        subheadline: string
        description: string
        descriptionHighlight: string
        ctaStart: string
        ctaLogin: string
        badgeGDPR: string
        badgeLanguages: string
        badgeParents: string
        howItWorksTitle: string
        howItWorksSubtitle: string
        step1Title: string
        step1Desc: string
        step2Title: string
        step2Desc: string
        step3Title: string
        step3Desc: string
        featuresTitle: string
        featuresSubtitle: string
        featureAI: string
        featureAIDesc: string
        featureLanguage: string
        featureLanguageDesc: string
        featureProgress: string
        featureProgressDesc: string
        featureExercises: string
        featureExercisesDesc: string
        featureFlashcards: string
        featureFlashcardsDesc: string
        featureParentTips: string
        featureParentTipsDesc: string
        languageTitle: string
        languageMascotMessage: string
        languageDesc: string
        testimonial: string
        testimonialAuthor: string
        ctaTitle: string
        ctaMascotMessage: string
        ctaDesc: string
        ctaButton: string
        ctaNote: string
        footerPrivacy: string
        footerTerms: string
        footerSupport: string
        footerCopyright: string
    }
    login: {
        mascotMessage: string
        title: string
        subtitle: string
        emailLabel: string
        passwordLabel: string
        passwordPlaceholder: string
        forgotPassword: string
        loginButton: string
        loggingIn: string
        googleButton: string
        dividerOr: string
        noAccount: string
        createAccount: string
        errorInvalidCredentials: string
        errorUnexpected: string
        footerText: string
        termsOfService: string
        privacyPolicy: string
        footerAnd: string
        footerEnd: string
    }
    signup: {
        mascotMessage: string
        title: string
        subtitle: string
        nameLabel: string
        namePlaceholder: string
        emailLabel: string
        phoneLabel: string
        phoneOptional: string
        languageLabel: string
        passwordLabel: string
        passwordPlaceholder: string
        confirmPasswordLabel: string
        confirmPasswordPlaceholder: string
        submitButton: string
        submitting: string
        googleButton: string
        dividerOr: string
        hasAccount: string
        signIn: string
        verifyEmailTitle: string
        verifyEmailDesc: (email: string) => string
        backToLogin: string
        errorPasswordMismatch: string
        errorPasswordLength: string
        errorAccountCreatedLoginFailed: string
        errorUnexpected: string
        footerText: string
        termsOfService: string
        privacyPolicy: string
        footerAnd: string
        footerEnd: string
    }
    forgotPassword: {
        mascotMessage: string
        mascotMessageSuccess: string
        title: string
        subtitle: string
        emailLabel: string
        submitButton: string
        submitting: string
        successMessage: (email: string) => string
        backToLogin: string
    }
    resetPassword: {
        mascotMessage: string
        mascotMessageSuccess: string
        mascotMessageError: string
        title: string
        subtitle: string
        invalidTitle: string
        invalidDesc: string
        invalidButton: string
        successTitle: string
        successDesc: string
        successButton: string
        passwordLabel: string
        passwordPlaceholder: string
        confirmPasswordLabel: string
        confirmPasswordPlaceholder: string
        submitButton: string
        submitting: string
        errorMismatch: string
        errorLength: string
        errorUnexpected: string
    }
}

const translations: Record<PreLoginLang, PreLoginTranslations> = {
    de: {
        landing: {
            mascotMessage: 'Willkommen! Ich bin hier, um zu helfen!',
            headline: 'GradeAI',
            subheadline: 'Der Lernbegleiter für Ihr Kind',
            description: 'Laden Sie einen deutschen Schultest hoch. Erhalten Sie sofort liebevolles Feedback in Ihrer Sprache.',
            descriptionHighlight: 'Denn jedes Kind verdient es, verstanden zu werden.',
            ctaStart: 'Kostenlos starten',
            ctaLogin: 'Ich habe ein Konto',
            badgeGDPR: 'DSGVO-konform',
            badgeLanguages: '7+ Sprachen',
            badgeParents: 'Für Eltern gemacht',
            howItWorksTitle: 'So funktioniert es',
            howItWorksSubtitle: 'Drei einfache Schritte, um die Lernreise Ihres Kindes zu verstehen',
            step1Title: 'Fotografieren & Hochladen',
            step1Desc: 'Machen Sie ein Foto vom Test Ihres Kindes oder laden Sie ein PDF hoch. Unsere KI liest deutsche Handschrift mühelos.',
            step2Title: 'KI analysiert',
            step2Desc: 'Unser weiser KI-Lehrer überprüft jede Antwort, erkennt Stärken und findet Verbesserungsbereiche.',
            step3Title: 'Bericht erhalten',
            step3Desc: 'Erhalten Sie einen freundlichen Bericht in Ihrer Sprache mit Übungen, Lernkarten und Tipps für Eltern.',
            featuresTitle: 'Alles was Sie brauchen',
            featuresSubtitle: 'Werkzeuge, mit Liebe für Eltern entwickelt, denen die Bildung ihrer Kinder am Herzen liegt',
            featureAI: 'KI-gestützte Analyse',
            featureAIDesc: 'Versteht deutsche Schultests, Lehrernotizen und handschriftliche Korrekturen',
            featureLanguage: 'Ihre Sprache',
            featureLanguageDesc: 'Berichte auf Deutsch, Englisch, Türkisch, Arabisch, Farsi, Russisch & mehr',
            featureProgress: 'Fortschritt verfolgen',
            featureProgressDesc: 'Sehen Sie, wie sich Ihr Kind mit schönen Diagrammen verbessert',
            featureExercises: 'Übungsaufgaben',
            featureExercisesDesc: 'Maßgeschneiderte Übungen basierend auf dem, was Ihr Kind üben muss',
            featureFlashcards: 'Lernkarten',
            featureFlashcardsDesc: 'Automatisch generierte Lernkarten aus Testthemen zur einfachen Wiederholung',
            featureParentTips: 'Eltern-Tipps',
            featureParentTipsDesc: 'Praktische Ratschläge, wie Sie Ihr Kind zu Hause unterstützen können',
            languageTitle: 'Wir sprechen Ihre Sprache',
            languageMascotMessage: 'Ich spreche Ihre Sprache!',
            languageDesc: 'Ob Sie zu Hause Türkisch, Arabisch, Farsi, Russisch oder Englisch sprechen — wir übersetzen alles, damit Sie die Bildung Ihres Kindes in Deutschland voll unterstützen können.',
            testimonial: '„Endlich kann ich die deutschen Tests meiner Tochter verstehen und ihr bei den Hausaufgaben helfen!"',
            testimonialAuthor: '— Eine Mutter in Hamburg',
            ctaTitle: 'Bereit, Ihr Kind zu unterstützen?',
            ctaMascotMessage: 'Starten wir diese Reise gemeinsam!',
            ctaDesc: 'Schließen Sie sich tausenden Eltern an, die die Bildung ihrer Kinder mit GradeAI besser verstehen.',
            ctaButton: 'Kostenlos starten',
            ctaNote: 'Keine Kreditkarte erforderlich • Kostenlos für Ihre ersten 3 Tests',
            footerPrivacy: 'Datenschutz',
            footerTerms: 'Nutzungsbedingungen',
            footerSupport: 'Support',
            footerCopyright: '© 2024 GradeAI. Mit ❤️ für Eltern gemacht.',
        },
        login: {
            mascotMessage: 'Willkommen zurück!',
            title: 'Willkommen zurück',
            subtitle: 'Melden Sie sich bei Ihrem GradeAI-Konto an',
            emailLabel: 'E-Mail-Adresse',
            passwordLabel: 'Passwort',
            passwordPlaceholder: 'Passwort eingeben',
            forgotPassword: 'Passwort vergessen?',
            loginButton: 'Anmelden',
            loggingIn: 'Anmeldung...',
            googleButton: 'Mit Google anmelden',
            dividerOr: 'oder',
            noAccount: 'Noch kein Konto?',
            createAccount: 'Konto erstellen',
            errorInvalidCredentials: 'Ungültige E-Mail oder Passwort',
            errorUnexpected: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
            footerText: 'Mit der Anmeldung stimmen Sie unseren',
            termsOfService: 'Nutzungsbedingungen',
            privacyPolicy: 'Datenschutzerklärung',
            footerAnd: 'und der',
            footerEnd: 'zu',
        },
        signup: {
            mascotMessage: 'Mach mit!',
            title: 'Konto erstellen',
            subtitle: 'Treten Sie GradeAI bei und unterstützen Sie das Lernen Ihres Kindes',
            nameLabel: 'Vollständiger Name',
            namePlaceholder: 'Max Mustermann',
            emailLabel: 'E-Mail-Adresse',
            phoneLabel: 'Telefonnummer',
            phoneOptional: '(optional)',
            languageLabel: 'Bevorzugte Sprache',
            passwordLabel: 'Passwort',
            passwordPlaceholder: 'Mindestens 8 Zeichen',
            confirmPasswordLabel: 'Passwort bestätigen',
            confirmPasswordPlaceholder: 'Passwort erneut eingeben',
            submitButton: 'Konto erstellen',
            submitting: 'Konto wird erstellt...',
            googleButton: 'Mit Google registrieren',
            dividerOr: 'oder',
            hasAccount: 'Haben Sie bereits ein Konto?',
            signIn: 'Anmelden',
            verifyEmailTitle: 'Überprüfe deine E-Mails',
            verifyEmailDesc: (email: string) => `Wir haben einen Bestätigungslink an ${email} gesendet. Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.`,
            backToLogin: 'Zurück zum Login',
            errorPasswordMismatch: 'Passwörter stimmen nicht überein',
            errorPasswordLength: 'Das Passwort muss mindestens 8 Zeichen lang sein',
            errorAccountCreatedLoginFailed: 'Konto erstellt, aber Anmeldung fehlgeschlagen. Bitte versuchen Sie sich manuell anzumelden.',
            errorUnexpected: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
            footerText: 'Mit der Erstellung eines Kontos stimmen Sie unseren',
            termsOfService: 'Nutzungsbedingungen',
            privacyPolicy: 'Datenschutzerklärung',
            footerAnd: 'und der',
            footerEnd: 'zu',
        },
        forgotPassword: {
            mascotMessage: 'Passwort vergessen?',
            mascotMessageSuccess: 'E-Mail gesendet!',
            title: 'Passwort vergessen',
            subtitle: 'Kein Problem! Wir senden dir einen Link zum Zurücksetzen.',
            emailLabel: 'E-Mail-Adresse',
            submitButton: 'Link anfordern',
            submitting: 'Wird gesendet...',
            successMessage: (email: string) => `Wenn ein Konto mit ${email} existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts gesendet.`,
            backToLogin: 'Zurück zum Login',
        },
        resetPassword: {
            mascotMessage: 'Neues Passwort',
            mascotMessageSuccess: 'Fertig!',
            mascotMessageError: 'Oje...',
            title: 'Passwort zurücksetzen',
            subtitle: 'Gib jetzt dein neues Passwort ein.',
            invalidTitle: 'Ungültiger Link',
            invalidDesc: 'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.',
            invalidButton: 'Neuen Link anfordern',
            successTitle: 'Erfolgreich!',
            successDesc: 'Dein Passwort wurde erfolgreich geändert. Du wirst nun zum Login weitergeleitet.',
            successButton: 'Jetzt anmelden',
            passwordLabel: 'Neues Passwort',
            passwordPlaceholder: 'Mindestens 8 Zeichen',
            confirmPasswordLabel: 'Passwort bestätigen',
            confirmPasswordPlaceholder: 'Passwort erneut eingeben',
            submitButton: 'Passwort speichern',
            submitting: 'Wird gespeichert...',
            errorMismatch: 'Passwörter stimmen nicht überein.',
            errorLength: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
            errorUnexpected: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
        },
    },
    en: {
        landing: {
            mascotMessage: 'Welcome! I\'m here to help!',
            headline: 'GradeAI',
            subheadline: 'Your Child\'s Learning Companion',
            description: 'Upload any German school test. Get instant, caring feedback in your language.',
            descriptionHighlight: 'Because every child deserves to be understood.',
            ctaStart: 'Start Free',
            ctaLogin: 'I have an account',
            badgeGDPR: 'GDPR Compliant',
            badgeLanguages: '7+ Languages',
            badgeParents: 'Made for Parents',
            howItWorksTitle: 'How It Works',
            howItWorksSubtitle: 'Three simple steps to understand your child\'s learning journey',
            step1Title: 'Snap & Upload',
            step1Desc: 'Take a photo of your child\'s test or upload a PDF. Our AI reads German handwriting with ease.',
            step2Title: 'AI Analyzes',
            step2Desc: 'Our wise AI teacher reviews every answer, identifies strengths, and finds areas to improve.',
            step3Title: 'Get Your Report',
            step3Desc: 'Receive a friendly report in your language with exercises, flashcards, and tips for parents.',
            featuresTitle: 'Everything You Need',
            featuresSubtitle: 'Tools designed with love for parents who care about their children\'s education',
            featureAI: 'AI-Powered Analysis',
            featureAIDesc: 'Understands German school tests, teacher notes, and handwritten corrections',
            featureLanguage: 'Your Language',
            featureLanguageDesc: 'Reports in German, English, Turkish, Arabic, Farsi, Russian & more',
            featureProgress: 'Track Progress',
            featureProgressDesc: 'See how your child improves over time with beautiful charts',
            featureExercises: 'Practice Exercises',
            featureExercisesDesc: 'Custom exercises based on exactly what your child needs to practice',
            featureFlashcards: 'Flashcards',
            featureFlashcardsDesc: 'Automatically generated flashcards from test topics for easy review',
            featureParentTips: 'Parent Tips',
            featureParentTipsDesc: 'Practical advice on how to support your child at home',
            languageTitle: 'We Speak Your Language',
            languageMascotMessage: 'I speak your language!',
            languageDesc: 'Whether you speak Turkish, Arabic, Farsi, Russian, or English at home — we translate everything so you can fully support your child\'s education in Germany.',
            testimonial: '"Finally, I can understand my daughter\'s German tests and help her with homework!"',
            testimonialAuthor: '— A parent in Hamburg',
            ctaTitle: 'Ready to Support Your Child?',
            ctaMascotMessage: 'Let\'s start this journey together!',
            ctaDesc: 'Join thousands of parents who understand their children\'s education better with GradeAI.',
            ctaButton: 'Get Started for Free',
            ctaNote: 'No credit card required • Free for your first 3 tests',
            footerPrivacy: 'Privacy Policy',
            footerTerms: 'Terms of Service',
            footerSupport: 'Support',
            footerCopyright: '© 2024 GradeAI. Made with ❤️ for parents.',
        },
        login: {
            mascotMessage: 'Welcome back!',
            title: 'Welcome Back',
            subtitle: 'Sign in to your GradeAI account',
            emailLabel: 'Email Address',
            passwordLabel: 'Password',
            passwordPlaceholder: 'Enter your password',
            forgotPassword: 'Forgot password?',
            loginButton: 'Sign In',
            loggingIn: 'Signing in...',
            googleButton: 'Sign in with Google',
            dividerOr: 'or',
            noAccount: 'Don\'t have an account?',
            createAccount: 'Create Account',
            errorInvalidCredentials: 'Invalid email or password',
            errorUnexpected: 'An unexpected error occurred. Please try again.',
            footerText: 'By signing in, you agree to our',
            termsOfService: 'Terms of Service',
            privacyPolicy: 'Privacy Policy',
            footerAnd: 'and',
            footerEnd: '',
        },
        signup: {
            mascotMessage: 'Join us!',
            title: 'Create Account',
            subtitle: 'Join GradeAI and start supporting your child\'s learning',
            nameLabel: 'Full Name',
            namePlaceholder: 'John Doe',
            emailLabel: 'Email Address',
            phoneLabel: 'Phone Number',
            phoneOptional: '(optional)',
            languageLabel: 'Preferred Language',
            passwordLabel: 'Password',
            passwordPlaceholder: 'At least 8 characters',
            confirmPasswordLabel: 'Confirm Password',
            confirmPasswordPlaceholder: 'Re-enter your password',
            submitButton: 'Create Account',
            submitting: 'Creating Account...',
            googleButton: 'Sign up with Google',
            dividerOr: 'or',
            hasAccount: 'Already have an account?',
            signIn: 'Sign In',
            verifyEmailTitle: 'Check your emails',
            verifyEmailDesc: (email: string) => `We have sent a confirmation link to ${email}. Please click the link in the email to activate your account.`,
            backToLogin: 'Back to Login',
            errorPasswordMismatch: 'Passwords do not match',
            errorPasswordLength: 'Password must be at least 8 characters long',
            errorAccountCreatedLoginFailed: 'Account created but login failed. Please try logging in manually.',
            errorUnexpected: 'An unexpected error occurred. Please try again.',
            footerText: 'By creating an account, you agree to our',
            termsOfService: 'Terms of Service',
            privacyPolicy: 'Privacy Policy',
            footerAnd: 'and',
            footerEnd: '',
        },
        forgotPassword: {
            mascotMessage: 'Forgot password?',
            mascotMessageSuccess: 'Email sent!',
            title: 'Forgot Password',
            subtitle: 'No problem! We\'ll send you a reset link.',
            emailLabel: 'Email Address',
            submitButton: 'Request Link',
            submitting: 'Sending...',
            successMessage: (email: string) => `If an account exists for ${email}, we've sent you a link to reset your password.`,
            backToLogin: 'Back to Login',
        },
        resetPassword: {
            mascotMessage: 'New Password',
            mascotMessageSuccess: 'Done!',
            mascotMessageError: 'Oops...',
            title: 'Reset Password',
            subtitle: 'Enter your new password now.',
            invalidTitle: 'Invalid Link',
            invalidDesc: 'This password reset link is invalid or has expired.',
            invalidButton: 'Request New Link',
            successTitle: 'Success!',
            successDesc: 'Your password has been changed successfully. You are being redirected to login.',
            successButton: 'Sign In Now',
            passwordLabel: 'New Password',
            passwordPlaceholder: 'At least 8 characters',
            confirmPasswordLabel: 'Confirm Password',
            confirmPasswordPlaceholder: 'Re-enter your password',
            submitButton: 'Save Password',
            submitting: 'Saving...',
            errorMismatch: 'Passwords do not match.',
            errorLength: 'Password must be at least 8 characters long.',
            errorUnexpected: 'An error occurred. Please try again.',
        },
    },
}

/**
 * Hook that returns the pre-login translations based on the current language.
 * Falls back to 'de' for any language other than 'en'.
 */
export function usePreLoginTranslation() {
    const { language, setLanguage } = useLanguage()
    const lang: PreLoginLang = language === 'en' ? 'en' : 'de'
    return { t: translations[lang], language: lang, setLanguage }
}
