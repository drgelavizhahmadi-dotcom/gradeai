# GradeAI Parent Report - Multilingual AI-Powered Component

## 🌍 Overview

A comprehensive, AI-powered multilingual parent report component for GradeAI that uses dynamic translation instead of hardcoded translations.

## ✨ Features

- **9 Languages Supported**: German, English, Arabic, Farsi, Kurdish (Sorani & Kurmancî), Turkish, Romanian, Russian
- **RTL Support**: Proper right-to-left rendering for Arabic, Farsi, and Kurdish Sorani
- **AI-Powered Translation**: Uses Claude AI to translate reports on-the-fly
- **Smart Caching**: Translations are cached in localStorage to avoid repeated API calls
- **Minimal Static Translations**: Only essential UI labels are hardcoded
- **Beautiful Design**: Warm, supportive, parent-friendly interface with color-coded grades

## 📁 Structure

```
components/GradeAIParentReport/
├── index.tsx                          # Main component
├── LanguageContext.tsx                # Language provider with 9 languages
├── useReportTranslation.ts            # Translation hook with caching
├── staticLabels.ts                    # Minimal UI labels only
├── components/
│   ├── LanguageSelector.tsx           # Language switcher dropdown
│   └── ui/
│       ├── LoadingSpinner.tsx         # Loading indicator
│       ├── GradeBadge.tsx             # Color-coded grade display
│       ├── ProgressBar.tsx            # Progress visualization
│       └── ExpandableSection.tsx      # Collapsible sections
└── prompts/
    ├── analysisPrompt.ts              # English AI analysis prompt
    └── translationPrompt.ts           # Dynamic translation prompt

app/api/ai/translate/
└── route.ts                           # Translation API endpoint
```

## 🚀 Usage

### Basic Example

```tsx
import GradeAIParentReport from '@/components/GradeAIParentReport'

function ParentReportPage({ uploadId }: { uploadId: string }) {
  const analysisData = {
    header: {
      subject: "Englisch",
      gradeLevel: "Oberstufe / Q-Phase",
      studentName: "Max Mustermann",
      date: "2024",
      grade: "3",
      gradeNumeric: 3,
      percentage: 65,
      totalPoints: 39,
      maxPoints: 60
    },
    examStructure: [...],
    scores: {...},
    fairnessAssessment: {...},
    errorAnalysis: [...],
    strengthsIdentified: [...],
    riskAssessment: {...},
    recommendedActions: {...},
    metadata: {
      analysisConfidence: 86,
      ocrConfidence: 95,
      imageQuality: "good",
      analysisTimestamp: new Date().toISOString(),
      warnings: []
    }
  }

  return <GradeAIParentReport analysisData={analysisData} />
}
```

## 🔧 Configuration

### Environment Variables

Add to your `.env.local`:

```env
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### Supported Languages

The component supports these 9 languages:

| Code | Language | Script | Direction |
|------|----------|--------|-----------|
| `de` | Deutsch | Latin | LTR |
| `en` | English | Latin | LTR |
| `ar` | العربية | Arabic | RTL |
| `fa` | فارسی | Persian | RTL |
| `ku` | کوردی | Sorani | RTL |
| `kmr` | Kurdî Kurmancî | Latin | LTR |
| `tr` | Türkçe | Latin | LTR |
| `ro` | Română | Latin | LTR |
| `ru` | Русский | Cyrillic | LTR |

## 🎨 Design System

### Grade Colors

- **Excellent (70-100%)**: Emerald/Green gradient
- **Good (50-69%)**: Amber/Yellow gradient
- **Needs Work (30-49%)**: Orange gradient
- **Critical (0-29%)**: Red gradient

### Components

1. **Header**: Grade badge, student info, emotional support message
2. **Tab Navigation**: Overview, Analysis, Action Plan, Strengths
3. **Exam Structure**: Tasks, topics, requirements, word counts
4. **Score Breakdown**: Visual progress bars for each criterion
5. **Fairness Check**: Assessment of grading fairness
6. **Error Analysis**: Specific errors with examples and explanations
7. **Parent Actions**: Actionable steps for parents
8. **Learning Plan**: Prioritized learning activities
9. **Strengths**: Positive aspects and encouraging outlook

## 🔄 Translation Flow

1. **Analysis** (always in English) → Structured JSON data
2. **Translation** (on language change) → AI translates to target language
3. **Caching** (localStorage) → Avoid repeated translations
4. **Display** → Rendered in user's chosen language

## 📦 Dependencies

Required packages:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^latest",
    "lucide-react": "^latest",
    "react": "^18.x",
    "next": "^14.x"
  }
}
```

## 🧪 Example Analysis Data

See the sample data structure in `/prompts/analysisPrompt.ts` for the complete schema.

## 🎯 Benefits

### vs. Hardcoded Translations

| Aspect | Hardcoded | AI Dynamic |
|--------|-----------|------------|
| Languages | Must code each | Add instantly |
| Maintenance | Update 11+ files | Update 1 prompt |
| Quality | Variable | Native-level |
| Cultural Adaptation | Manual | Automatic |
| New Content | Requires translation | Automatic |
| Cost | Dev time upfront | API cost per translation |
| Speed | Instant | ~1-2 seconds (then cached) |

## 🔐 Security

- API keys stored in environment variables
- No sensitive data in localStorage
- Translations cached client-side only
- Server-side validation of translation requests

## 🐛 Error Handling

- Falls back to English if translation fails
- Retry button for failed translations
- Graceful degradation for missing data
- Clear error messages

## 📝 License

Part of the GradeAI project.

## 🤝 Contributing

When adding new languages:

1. Add language to `SUPPORTED_LANGUAGES` in `LanguageContext.tsx`
2. Add static labels in `staticLabels.ts`
3. Add language-specific instructions in `translationPrompt.ts`

## 📞 Support

For questions or issues, please contact the GradeAI team.
