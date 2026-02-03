'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { OwlMascot, FoxMascot, CatMascot } from "@/components/mascots";
import {
  Upload,
  Sparkles,
  TrendingUp,
  Globe,
  Shield,
  Heart,
  ArrowRight,
  BookOpen,
  Star,
  CheckCircle
} from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl opacity-10 animate-float">📚</div>
        <div className="absolute top-40 right-20 text-3xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute top-60 left-1/4 text-2xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>⭐</div>
        <div className="absolute bottom-40 right-1/4 text-3xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>📝</div>
        <div className="absolute bottom-20 left-20 text-2xl opacity-10 animate-float" style={{ animationDelay: '1.5s' }}>🎓</div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--gold-soft)] via-[var(--background)] to-[var(--background)] opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[90vh] flex-col items-center justify-center py-12 text-center">

            {/* Mascot Hero */}
            <div className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <OwlMascot
                mood="happy"
                size="xl"
                message="Welcome! I'm here to help!"
                showMessage={true}
              />
            </div>

            {/* Main Headline */}
            <div className={`mb-8 space-y-4 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1
                className="text-5xl font-bold tracking-tight text-[var(--gray-800)] sm:text-6xl md:text-7xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                GradeAI
              </h1>
              <p
                className="text-2xl text-[var(--primary)] sm:text-3xl md:text-4xl font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Your Child's Learning Companion
              </p>
              <p className="mx-auto max-w-2xl text-lg text-[var(--gray-600)] sm:text-xl mt-4">
                Upload any German school test. Get instant, caring feedback in your language.
                <br className="hidden sm:block" />
                <span className="text-[var(--primary-dark)] font-medium">Because every child deserves to be understood.</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 mt-8 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Link
                href="/signup"
                className="btn-coral inline-flex items-center gap-2 text-lg px-8 py-4 shadow-lg hover:shadow-xl"
              >
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-lg px-8 py-4 rounded-xl bg-white border-2 border-[var(--gray-200)] text-[var(--gray-700)] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                I have an account
              </Link>
            </div>

            {/* Trust badges */}
            <div className={`mt-12 flex flex-wrap justify-center gap-6 text-sm text-[var(--gray-500)] transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--primary)]" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[var(--primary)]" />
                <span>7+ Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[var(--coral)]" />
                <span>Made for Parents</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[var(--gray-800)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              How It Works
            </h2>
            <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
              Three simple steps to understand your child's learning journey
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-[var(--primary-soft)] via-[var(--gold-soft)] to-[var(--coral-soft)] -translate-y-1/2 rounded-full" />

            {/* Step 1 */}
            <div className="relative card-story p-8 text-center bg-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                1
              </div>
              <div className="mb-6 mt-4 flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center">
                  <Upload className="h-10 w-10 text-[var(--primary)]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[var(--gray-800)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Snap & Upload
              </h3>
              <p className="text-[var(--gray-600)]">
                Take a photo of your child's test or upload a PDF. Our AI reads German handwriting with ease.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative card-story p-8 text-center bg-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[var(--gold)] text-white font-bold flex items-center justify-center text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                2
              </div>
              <div className="mb-6 mt-4 flex justify-center">
                <OwlMascot mood="thinking" size="md" showMessage={false} />
              </div>
              <h3 className="text-xl font-bold text-[var(--gray-800)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                AI Analyzes
              </h3>
              <p className="text-[var(--gray-600)]">
                Our wise AI teacher reviews every answer, identifies strengths, and finds areas to improve.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative card-story p-8 text-center bg-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[var(--coral)] text-white font-bold flex items-center justify-center text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                3
              </div>
              <div className="mb-6 mt-4 flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--coral-soft)] flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-[var(--coral)]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[var(--gray-800)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Get Your Report
              </h3>
              <p className="text-[var(--gray-600)]">
                Receive a friendly report in your language with exercises, flashcards, and tips for parents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[var(--gray-800)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Everything You Need
            </h2>
            <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
              Tools designed with love for parents who care about their children's education
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards */}
            {[
              {
                icon: <Sparkles className="h-8 w-8" />,
                title: "AI-Powered Analysis",
                description: "Understands German school tests, teacher notes, and handwritten corrections",
                color: "primary"
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: "Your Language",
                description: "Reports in German, English, Turkish, Arabic, Farsi, Russian & more",
                color: "lavender"
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Track Progress",
                description: "See how your child improves over time with beautiful charts",
                color: "success"
              },
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: "Practice Exercises",
                description: "Custom exercises based on exactly what your child needs to practice",
                color: "coral"
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: "Flashcards",
                description: "Automatically generated flashcards from test topics for easy review",
                color: "gold"
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Parent Tips",
                description: "Practical advice on how to support your child at home",
                color: "coral"
              }
            ].map((feature, index) => (
              <div key={index} className="card-story p-6 bg-white group">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                  ${feature.color === 'primary' ? 'bg-[var(--primary-soft)] text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white' : ''}
                  ${feature.color === 'lavender' ? 'bg-[var(--lavender-soft)] text-[var(--lavender)] group-hover:bg-[var(--lavender)] group-hover:text-white' : ''}
                  ${feature.color === 'success' ? 'bg-[var(--success-soft)] text-[var(--success)] group-hover:bg-[var(--success)] group-hover:text-white' : ''}
                  ${feature.color === 'coral' ? 'bg-[var(--coral-soft)] text-[var(--coral)] group-hover:bg-[var(--coral)] group-hover:text-white' : ''}
                  ${feature.color === 'gold' ? 'bg-[var(--gold-soft)] text-[var(--gold-dark)] group-hover:bg-[var(--gold)] group-hover:text-white' : ''}
                `}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {feature.title}
                </h3>
                <p className="text-[var(--gray-600)] text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Languages Section */}
      <div className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="card-story p-8 md:p-12 bg-gradient-to-br from-[var(--lavender-soft)] to-[var(--primary-soft)]">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <OwlMascot mood="happy" size="lg" message="I speak your language!" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[var(--gray-800)] mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  We Speak Your Language
                </h2>
                <p className="text-[var(--gray-600)] mb-6">
                  Whether you speak Turkish, Arabic, Farsi, Russian, or English at home —
                  we translate everything so you can fully support your child's education in Germany.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {['🇩🇪 Deutsch', '🇬🇧 English', '🇹🇷 Türkçe', '🇸🇦 العربية', '🇮🇷 فارسی', '🇷🇺 Русский', '🇺🇦 Українська'].map((lang, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-full bg-white text-[var(--gray-700)] text-sm font-medium shadow-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial/Quote Section */}
      <div className="py-24 bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <FoxMascot mood="happy" size="lg" showMessage={false} />
          </div>
          <blockquote className="text-2xl sm:text-3xl text-[var(--gray-700)] italic mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            "Finally, I can understand my daughter's German tests and help her with homework!"
          </blockquote>
          <p className="text-[var(--gray-500)]">
            — A parent in Hamburg
          </p>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 bg-celebration">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <OwlMascot mood="celebrating" size="xl" message="Let's start this journey together!" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[var(--gray-800)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to Support Your Child?
          </h2>
          <p className="text-lg text-[var(--gray-600)] mb-8 max-w-2xl mx-auto">
            Join thousands of parents who understand their children's education better with GradeAI.
          </p>
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4 shadow-lg hover:shadow-xl"
          >
            Get Started for Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-[var(--gray-500)]">
            No credit card required • Free for your first 3 tests
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-[var(--gray-200)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <OwlMascot mood="happy" size="sm" showMessage={false} />
              <span className="text-xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                GradeAI
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--gray-600)]">
              <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms of Service</Link>
              <Link href="/support" className="hover:text-[var(--primary)] transition-colors">Support</Link>
            </div>
            <p className="text-sm text-[var(--gray-500)]">
              © 2024 GradeAI. Made with ❤️ for parents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
