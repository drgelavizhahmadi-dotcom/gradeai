'use client'

import { useState, useEffect } from 'react'
import {
  Lock, Sparkles, Crown, Zap, BookOpen, Shield, ChevronRight,
  Star, TrendingUp, Users, Clock, Gift, ArrowRight, Check,
  Loader2, X, Download, Printer, AlertTriangle, CheckCircle
} from 'lucide-react'

// FOMO Statistics (can be fetched from API in production)
const FOMO_STATS = {
  upgradesThisWeek: 347,
  parentsSatisfied: 94,
  avgGradeImprovement: 0.8,
  flashcardsGenerated: 12847,
  fairnessChecksRun: 8293,
}

interface PremiumFeatureProps {
  isPremium: boolean
  childName?: string | undefined
  analysisData: any
  onUpgrade?: (() => void) | undefined
}

// Animated counter for FOMO effect
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number | undefined; suffix?: string | undefined }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count.toLocaleString()}{suffix}</span>
}

// Premium Badge Component
export function PremiumBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | undefined }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-full ${sizes[size]} shadow-lg`}>
      <Crown className="h-3 w-3" />
      PRIME
    </span>
  )
}

// Upgrade CTA Button with urgency
export function UpgradeButton({
  variant = 'primary',
  showDiscount = true,
  onClick
}: {
  variant?: 'primary' | 'secondary' | 'minimal' | undefined
  showDiscount?: boolean | undefined
  onClick?: (() => void) | undefined
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl',
    secondary: 'bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50',
    minimal: 'text-amber-600 hover:text-amber-700 underline',
  }

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center gap-2`}
    >
      <Crown className="h-5 w-5" />
      <span>Upgrade to Prime</span>
      {showDiscount && variant === 'primary' && (
        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">-40% heute</span>
      )}
    </button>
  )
}

// Locked Feature Teaser Component
export function LockedFeatureTeaser({
  title,
  description,
  icon: Icon,
  previewContent,
  stats,
  onUpgrade,
}: {
  title: string
  description: string
  icon: any
  previewContent?: React.ReactNode | undefined
  stats?: { label: string; value: string }[] | undefined
  onUpgrade?: (() => void) | undefined
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      {/* Premium badge */}
      <div className="absolute top-4 right-4">
        <PremiumBadge size="sm" />
      </div>

      {/* Icon and title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-amber-100 rounded-xl">
          <Icon className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {title}
            <Lock className="h-4 w-4 text-amber-500" />
          </h3>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
      </div>

      {/* Blurred preview */}
      {previewContent && (
        <div className="relative mb-4">
          <div className="blur-sm opacity-60 pointer-events-none">
            {previewContent}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/80 to-transparent">
            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Freischalten mit Prime</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="flex gap-4 mb-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Users className="h-4 w-4" />
          <AnimatedCounter end={FOMO_STATS.upgradesThisWeek} /> Eltern diese Woche
        </div>
        <UpgradeButton variant="primary" onClick={onUpgrade} />
      </div>
    </div>
  )
}

// Flashcards Premium Section
export function FlashcardsPremiumSection({
  isPremium,
  childName,
  analysisData,
  onUpgrade
}: PremiumFeatureProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [flashcards, setFlashcards] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  const generateFlashcards = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisData,
          childName,
          targetLanguage: 'de',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate flashcards')
      }

      setFlashcards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCard = (index: number) => {
    const newFlipped = new Set(flippedCards)
    if (newFlipped.has(index)) {
      newFlipped.delete(index)
    } else {
      newFlipped.add(index)
    }
    setFlippedCards(newFlipped)
  }

  // Free preview cards (show 2 blurred)
  const previewCards = [
    { front: 'Was ist der Unterschied zwischen...?', back: '••••••••••••••••', difficulty: 'medium' },
    { front: 'Erkläre den Begriff...', back: '••••••••••••••••', difficulty: 'easy' },
  ]

  if (!isPremium) {
    return (
      <LockedFeatureTeaser
        title="Personalisierte Lernkarten"
        description={`${analysisData?.weaknesses?.length || 3}+ Lernkarten speziell für ${childName || 'Ihr Kind'} basierend auf den Testschwächen`}
        icon={BookOpen}
        previewContent={
          <div className="grid grid-cols-2 gap-3">
            {previewCards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">{card.front}</div>
                <div className="mt-2 text-xs text-gray-400">{card.back}</div>
              </div>
            ))}
          </div>
        }
        stats={[
          { label: 'Karten erstellt', value: FOMO_STATS.flashcardsGenerated.toLocaleString() },
          { label: 'Notenverbesserung', value: `+${FOMO_STATS.avgGradeImprovement}` },
        ]}
        onUpgrade={onUpgrade}
      />
    )
  }

  // Premium user - full feature
  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-amber-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Personalisierte Lernkarten
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">Maßgeschneidert für {childName || 'Ihr Kind'}</p>
          </div>
        </div>

        {!flashcards && (
          <button
            onClick={generateFlashcards}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Erstelle Karten...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Lernkarten generieren
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {flashcards && (
        <div className="space-y-6">
          {/* Study plan */}
          {flashcards.studyPlan && (
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Lernplan
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tägliches Ziel:</span>
                  <p className="font-medium">{flashcards.studyPlan.dailyGoal}</p>
                </div>
                <div>
                  <span className="text-gray-500">Gesamtzeit:</span>
                  <p className="font-medium">{flashcards.studyPlan.totalTime}</p>
                </div>
                <div>
                  <span className="text-gray-500">Wiederholung:</span>
                  <p className="font-medium">{flashcards.studyPlan.reviewSchedule}</p>
                </div>
              </div>
            </div>
          )}

          {/* Flashcards grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {flashcards.flashcards?.map((card: any, i: number) => (
              <div
                key={i}
                onClick={() => toggleCard(i)}
                className="cursor-pointer perspective-1000"
              >
                <div className={`relative transition-transform duration-500 transform-style-preserve-3d ${flippedCards.has(i) ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className={`bg-white rounded-xl p-5 border-2 border-amber-200 shadow-md ${flippedCards.has(i) ? 'hidden' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        card.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        card.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {card.difficulty === 'easy' ? 'Leicht' : card.difficulty === 'hard' ? 'Schwer' : 'Mittel'}
                      </span>
                      <span className="text-xs text-gray-400">Klicken zum Umdrehen</span>
                    </div>
                    <p className="text-lg font-medium text-gray-800">{card.front}</p>
                    {card.forWeakness && (
                      <p className="mt-3 text-xs text-gray-500 border-t pt-2">
                        Für: {card.forWeakness}
                      </p>
                    )}
                  </div>

                  {/* Back */}
                  <div className={`bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-md ${!flippedCards.has(i) ? 'hidden' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Antwort</span>
                      <span className="text-xs opacity-70">Klicken zum Umdrehen</span>
                    </div>
                    <p className="text-lg font-medium">{card.back}</p>
                    {card.tip && (
                      <p className="mt-3 text-sm bg-white/10 rounded-lg p-2">
                        💡 {card.tip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
              <Printer className="h-4 w-4" />
              Drucken
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
              <Download className="h-4 w-4" />
              PDF herunterladen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Fairness Check Premium Section
export function FairnessCheckPremiumSection({
  isPremium,
  childName,
  analysisData,
  onUpgrade
}: PremiumFeatureProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [fairnessData, setFairnessData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeFairness = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-fairness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisData,
          childName,
          targetLanguage: 'de',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze fairness')
      }

      setFairnessData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'fair': return 'text-green-600 bg-green-50 border-green-200'
      case 'mostly_fair': return 'text-green-600 bg-green-50 border-green-200'
      case 'questionable': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'needs_review': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case 'fair': return 'Bewertung ist fair'
      case 'mostly_fair': return 'Überwiegend fair'
      case 'questionable': return 'Einige Fragen offen'
      case 'needs_review': return 'Überprüfung empfohlen'
      default: return 'Nicht bewertbar'
    }
  }

  if (!isPremium) {
    return (
      <LockedFeatureTeaser
        title="Fairness-Check der Bewertung"
        description="Wurde Ihr Kind fair bewertet? KI-Analyse der Benotung mit konkreten Handlungsempfehlungen"
        icon={Shield}
        previewContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
              <span className="text-gray-700">Fairness-Score</span>
              <span className="text-2xl font-bold text-gray-400">??%</span>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <span className="text-gray-500">Wir haben <strong className="text-amber-600">3 mögliche Bedenken</strong> gefunden...</span>
            </div>
          </div>
        }
        stats={[
          { label: 'Checks durchgeführt', value: FOMO_STATS.fairnessChecksRun.toLocaleString() },
          { label: 'Eltern zufrieden', value: `${FOMO_STATS.parentsSatisfied}%` },
        ]}
        onUpgrade={onUpgrade}
      />
    )
  }

  // Premium user - full feature
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Fairness-Check
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">Objektive Analyse der Bewertung</p>
          </div>
        </div>

        {!fairnessData && (
          <button
            onClick={analyzeFairness}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Fairness prüfen
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {fairnessData && (
        <div className="space-y-6">
          {/* Main score and verdict */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-blue-200 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{fairnessData.fairnessScore}%</div>
              <div className="text-gray-600">Fairness-Score</div>
            </div>
            <div className={`rounded-xl p-6 border ${getVerdictColor(fairnessData.verdict)} text-center`}>
              <div className="text-2xl font-bold mb-2">{getVerdictText(fairnessData.verdict)}</div>
              <div className="text-sm opacity-80">{fairnessData.verdictExplanation}</div>
            </div>
          </div>

          {/* Analysis breakdown */}
          {fairnessData.analysis && (
            <div className="bg-white rounded-xl p-5 border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-4">Detailanalyse</h4>
              <div className="space-y-3">
                {Object.entries(fairnessData.analysis).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600 capitalize">
                      {key === 'consistency' ? 'Konsistenz' :
                       key === 'clarity' ? 'Klarheit' :
                       key === 'proportionality' ? 'Verhältnismäßigkeit' :
                       key === 'feedbackQuality' ? 'Feedback-Qualität' :
                       key === 'partialCredit' ? 'Teilpunkte' : key}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${value.score >= 80 ? 'bg-green-500' : value.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${value.score}%` }}
                      />
                    </div>
                    <div className="w-12 text-right font-medium">{value.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {fairnessData.concerns && fairnessData.concerns.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Mögliche Bedenken
              </h4>
              <ul className="space-y-2">
                {fairnessData.concerns.map((concern: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-amber-700">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      concern.severity === 'significant' ? 'bg-red-100 text-red-700' :
                      concern.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {concern.severity === 'significant' ? 'Wichtig' :
                       concern.severity === 'moderate' ? 'Moderat' : 'Gering'}
                    </span>
                    <span>{concern.issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {fairnessData.recommendation && (
            <div className="bg-white rounded-xl p-5 border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-3">Empfehlung</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {fairnessData.recommendation.shouldDiscussWithTeacher ? (
                    <span className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="h-5 w-5" />
                      Gespräch mit Lehrer empfohlen
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Kein Gespräch nötig
                    </span>
                  )}
                </div>
                {fairnessData.recommendation.suggestedApproach && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    💡 {fairnessData.recommendation.suggestedApproach}
                  </p>
                )}
                {fairnessData.recommendation.questionsToAsk && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Fragen für das Gespräch:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {fairnessData.recommendation.questionsToAsk.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recoverable points */}
          {fairnessData.potentialPointsRecoverable && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 flex items-center justify-between">
              <span className="text-green-800">Möglicherweise erreichbare Punkte:</span>
              <span className="text-xl font-bold text-green-600">{fairnessData.potentialPointsRecoverable}</span>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center">
            {fairnessData.disclaimer || 'Diese Analyse dient nur zur Orientierung. Im Zweifel sprechen Sie direkt mit dem Lehrer.'}
          </p>
        </div>
      )}
    </div>
  )
}

// Upgrade Modal with FOMO
export function UpgradeModal({
  isOpen,
  onClose,
  feature,
}: {
  isOpen: boolean
  onClose: () => void
  feature?: 'flashcards' | 'fairness' | undefined
}) {
  if (!isOpen) return null

  const features = [
    { icon: BookOpen, text: 'Unbegrenzte personalisierte Lernkarten' },
    { icon: Shield, text: 'Fairness-Check für jede Bewertung' },
    { icon: TrendingUp, text: 'Detaillierte Fortschrittsanalysen' },
    { icon: Sparkles, text: 'Prioritäts-Support' },
    { icon: Download, text: 'PDF-Export aller Berichte' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <Crown className="h-10 w-10" />
            <div>
              <h2 className="text-2xl font-bold">GradeAI Prime</h2>
              <p className="opacity-90">Das Beste für Ihr Kind</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-lg p-3 text-center">
            <span className="text-3xl font-bold">€9.99</span>
            <span className="text-lg">/Monat</span>
            <span className="ml-3 line-through opacity-70">€16.99</span>
            <span className="ml-2 bg-white text-amber-600 px-2 py-0.5 rounded text-sm font-bold">-40%</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Urgency banner */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Angebot endet bald!</p>
              <p className="text-sm text-red-600">Nur noch 23:47:12 verbleibend</p>
            </div>
          </div>

          {/* Features list */}
          <ul className="space-y-3 mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <f.icon className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-gray-700">{f.text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm text-gray-600">+<AnimatedCounter end={FOMO_STATS.upgradesThisWeek} /> diese Woche</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-sm text-gray-600 ml-2">{FOMO_STATS.parentsSatisfied}% zufriedene Eltern</span>
            </div>
          </div>

          {/* CTA buttons */}
          <button className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
            <Gift className="h-5 w-5" />
            Jetzt Prime werden
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Jederzeit kündbar • 30 Tage Geld-zurück-Garantie
          </p>
        </div>
      </div>
    </div>
  )
}
