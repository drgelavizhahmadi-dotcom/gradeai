export interface PageImage {
  pageNumber: number;
  base64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  sizeKB: number;
}

export interface GradeInfo {
  value: string | null;
  description: string | null;
  points: string | null;
  breakdown: Record<string, string> | null;
  confidence: 'high' | 'medium' | 'low' | 'not_found';
  foundOnPage: number | null;
}

export interface TeacherFeedback {
  mainComment: string | null;
  marginNotes: string[];
  corrections: string[];
  tone: 'positive' | 'neutral' | 'critical' | null;
}

export interface StrengthItem {
  point: string;
  evidence: string;
}

export interface WeaknessItem {
  point: string;
  evidence: string;
  teacherNote: string | null;
}

export interface RecommendationItem {
  action: string;
  priority: 'high' | 'medium' | 'low';
  basedOn: string;
  timeframe?: string;
}

export interface VisionAnalysisResult {
  provider: 'claude' | 'gemini' | 'mistral';
  success: boolean;
  error?: string;
  durationMs: number;

  student: {
    name: string | null;
    class: string | null;
  };
  test: {
    subject: string | null;
    date: string | null;
    topic: string | null;
    duration: string | null;
  };
  grade: GradeInfo;
  teacherFeedback: TeacherFeedback;
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  recommendations: RecommendationItem[];

  metadata: {
    pagesAnalyzed: number;
    confidence: number;
    hasRedMarks: boolean;
    hasHandwriting: boolean;
    rawResponse?: string;
  };
}

export interface ConsensusResult {
  finalResult: VisionAnalysisResult;
  consensus: {
    gradeAgreement: 'full' | 'partial' | 'none';
    providersUsed: string[];
    providersSucceeded: string[];
    providersFailed: string[];
  };
  individualResults: VisionAnalysisResult[];
  warnings: string[];
  overallConfidence: number;
}

export interface VisionProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  timeout: number;
}

// Empty result factory for error cases
export function createEmptyResult(provider: 'claude' | 'gemini' | 'mistral', error: string, durationMs: number, pagesAnalyzed: number): VisionAnalysisResult {
  return {
    provider,
    success: false,
    error,
    durationMs,
    student: { name: null, class: null },
    test: { subject: null, date: null, topic: null, duration: null },
    grade: { value: null, description: null, points: null, breakdown: null, confidence: 'not_found', foundOnPage: null },
    teacherFeedback: { mainComment: null, marginNotes: [], corrections: [], tone: null },
    strengths: [],
    weaknesses: [],
    recommendations: [],
    metadata: { pagesAnalyzed, confidence: 0, hasRedMarks: false, hasHandwriting: false },
  };
}
