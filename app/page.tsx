'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { OwlMascot, FoxMascot, CatMascot } from "@/components/mascots";
import { usePreLoginTranslation } from "@/lib/preLoginTranslations";
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
  const { t, language, setLanguage } = usePreLoginTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-1 py-1 shadow-lg border border-[var(--gray-200)]">
          <button
            onClick={() => setLanguage('de')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${language === 'de'
                ? 'bg-[var(--primary)] text-white shadow-md'
                : 'text-[var(--gray-600)] hover:text-[var(--gray-800)]'
              }`}
          >
            DE
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${language === 'en'
                ? 'bg-[var(--primary)] text-white shadow-md'
                : 'text-[var(--gray-600)] hover:text-[var(--gray-800)]'
              }`}
          >
            EN
          </button>
        </div>
      </div>

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
                message={t.landing.mascotMessage}
                showMessage={true}
              />
            </div>

            {/* Main Headline */}
            <div className={`mb-8 space-y-4 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1
                className="text-5xl font-bold tracking-tight text-[var(--gray-800)] sm:text-6xl md:text-7xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t.landing.headline}
              </h1>
              <p
                className="text-2xl text-[var(--primary)] sm:text-3xl md:text-4xl font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t.landing.subheadline}
              </p>
              <p className="mx-auto max-w-2xl text-lg text-[var(--gray-600)] sm:text-xl mt-4">
                {t.landing.description}
                <br className="hidden sm:block" />
                <span className="text-[var(--primary-dark)] font-medium">{t.landing.descriptionHighlight}</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 mt-8 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Link
                href="/signup"
                className="btn-coral inline-flex items-center gap-2 text-lg px-8 py-4 shadow-lg hover:shadow-xl"
              >
                {t.landing.ctaStart}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-lg px-8 py-4 rounded-xl bg-white border-2 border-[var(--gray-200)] text-[var(--gray-700)] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t.landing.ctaLogin}
              </Link>
            </div>

            {/* Trust badges */}
            <div className={`mt-12 flex flex-wrap justify-center gap-6 text-sm text-[var(--gray-500)] transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--primary)]" />
                <span>{t.landing.badgeGDPR}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[var(--primary)]" />
                <span>{t.landing.badgeLanguages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[var(--coral)]" />
                <span>{t.landing.badgeParents}</span>
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
              {t.landing.howItWorksTitle}
            </h2>
            <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
              {t.landing.howItWorksSubtitle}
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
                {t.landing.step1Title}
              </h3>
              <p className="text-[var(--gray-600)]">
                {t.landing.step1Desc}
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
                {t.landing.step2Title}
              </h3>
              <p className="text-[var(--gray-600)]">
                {t.landing.step2Desc}
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
                {t.landing.step3Title}
              </h3>
              <p className="text-[var(--gray-600)]">
                {t.landing.step3Desc}
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
              {t.landing.featuresTitle}
            </h2>
            <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
              {t.landing.featuresSubtitle}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards */}
            {[
              {
                icon: <Sparkles className="h-8 w-8" />,
                title: t.landing.featureAI,
                description: t.landing.featureAIDesc,
                color: "primary"
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: t.landing.featureLanguage,
                description: t.landing.featureLanguageDesc,
                color: "lavender"
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: t.landing.featureProgress,
                description: t.landing.featureProgressDesc,
                color: "success"
              },
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: t.landing.featureExercises,
                description: t.landing.featureExercisesDesc,
                color: "coral"
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: t.landing.featureFlashcards,
                description: t.landing.featureFlashcardsDesc,
                color: "gold"
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: t.landing.featureParentTips,
                description: t.landing.featureParentTipsDesc,
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
                <OwlMascot mood="happy" size="lg" message={t.landing.languageMascotMessage} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[var(--gray-800)] mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t.landing.languageTitle}
                </h2>
                <p className="text-[var(--gray-600)] mb-6">
                  {t.landing.languageDesc}
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
            {t.landing.testimonial}
          </blockquote>
          <p className="text-[var(--gray-500)]">
            {t.landing.testimonialAuthor}
          </p>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 bg-celebration">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <OwlMascot mood="celebrating" size="xl" message={t.landing.ctaMascotMessage} />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[var(--gray-800)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t.landing.ctaTitle}
          </h2>
          <p className="text-lg text-[var(--gray-600)] mb-8 max-w-2xl mx-auto">
            {t.landing.ctaDesc}
          </p>
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4 shadow-lg hover:shadow-xl"
          >
            {t.landing.ctaButton}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-[var(--gray-500)]">
            {t.landing.ctaNote}
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
              <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">{t.landing.footerPrivacy}</Link>
              <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">{t.landing.footerTerms}</Link>
              <Link href="/support" className="hover:text-[var(--primary)] transition-colors">{t.landing.footerSupport}</Link>
            </div>
            <p className="text-sm text-[var(--gray-500)]">
              {t.landing.footerCopyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
