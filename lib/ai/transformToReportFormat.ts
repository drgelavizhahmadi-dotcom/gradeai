/**
 * Transforms TestAnalysis format to GradeAIParentReport expected format
 */

import { TestAnalysis } from './prompts';

export interface ReportFormat {
  header: {
    grade: string;
    percentage: number;
    subject: string;
    gradeLevel: string;
    studentName: string;
    date: string;
  };
  examStructure: Array<{
    taskNumber: number;
    taskTypeGerman: string;
    topic: string;
    requirement: string;
    wordCountRequired?: number;
    wordCountActual?: number;
    pointsAchieved: number;
    pointsMax: number;
  }>;
  scores: {
    byTask: Array<{
      taskNumber: number;
      criteria: Array<{
        criterionKey: string;
        score: number;
        maxScore: number;
        isCritical?: boolean;
      }>;
    }>;
    overall: {
      achieved: number;
      maximum: number;
    };
  };
  fairnessAssessment: {
    overallFairness: string;
    reasoning: string;
  };
  riskAssessment: {
    urgencyLevel: string;
  };
  recommendedActions: {
    immediate: Array<{ action: string }>;
    learningPlan: Array<{
      focus: string;
      duration: string;
      timeCommitment: string;
      successMetric: string;
    }>;
  };
  errorAnalysis: Array<{
    errorTypeHuman: string;
    frequency: number;
    examples: Array<{ wrong: string; correct: string }>;
    explanation: string;
    rule: string;
  }>;
  strengthsIdentified: Array<{
    strengthType: string;
    description: string;
  }>;
}

export function transformToReportFormat(analysis: TestAnalysis): ReportFormat {
  const summary = analysis.summary || {};
  const performance = analysis.performance || { bySection: [], trends: [] };
  const teacherFeedback = analysis.teacherFeedback || { written: '', corrections: [], praise: [] };
  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const recommendations = analysis.recommendations || [];
  const longTermDevelopment = analysis.longTermDevelopment || {};

  // Transform header
  const header = {
    grade: String(summary.overallGrade || 'N/A'),
    percentage: Number(summary.percentage) || 0,
    subject: String(summary.subject || 'Unknown'),
    gradeLevel: String(summary.topic || 'Test'),
    studentName: String(summary.childName || 'Student'),
    date: summary.testDate || new Date().toLocaleDateString(),
  };

  // Transform exam structure from performance.bySection
  const examStructure = (performance.bySection || []).map((section, idx) => ({
    taskNumber: idx + 1,
    taskTypeGerman: section.name || `Task ${idx + 1}`,
    topic: section.notes || '',
    requirement: section.notes || 'Complete the task',
    pointsAchieved: section.pointsAchieved || 0,
    pointsMax: section.pointsPossible || 10,
  }));

  // If no sections, create a default one
  if (examStructure.length === 0) {
    examStructure.push({
      taskNumber: 1,
      taskTypeGerman: 'Test',
      topic: summary.topic || summary.subject || 'Assessment',
      requirement: 'Complete all questions',
      pointsAchieved: summary.overallScore || 0,
      pointsMax: summary.maxScore || 100,
    });
  }

  // Transform scores
  const scores = {
    byTask: examStructure.map((task, idx) => ({
      taskNumber: task.taskNumber,
      criteria: [{
        criterionKey: 'overall',
        score: task.pointsAchieved,
        maxScore: task.pointsMax,
        isCritical: task.pointsAchieved < task.pointsMax * 0.5,
      }],
    })),
    overall: {
      achieved: summary.overallScore || 0,
      maximum: summary.maxScore || 100,
    },
  };

  // Fairness assessment
  const fairnessAssessment = {
    overallFairness: 'fair',
    reasoning: teacherFeedback.evaluationMethodology || 'Standard evaluation methodology applied.',
  };

  // Risk assessment based on grade
  const gradeNum = parseFloat(String(summary.overallGrade).replace(/[^0-9.]/g, '')) || 3;
  const riskAssessment = {
    urgencyLevel: gradeNum >= 5 ? 'high' : gradeNum >= 4 ? 'medium' : 'none',
  };

  // Transform recommendations to actions
  const recommendedActions = {
    immediate: recommendations.slice(0, 3).map(rec => ({
      action: rec.action || 'Review and practice',
    })),
    learningPlan: recommendations.slice(0, 4).map(rec => ({
      focus: rec.category || 'Practice',
      duration: rec.timeframe || '1 week',
      timeCommitment: '15-30 minutes daily',
      successMetric: rec.rationale || 'Improved understanding',
    })),
  };

  // Default immediate actions if none
  if (recommendedActions.immediate.length === 0) {
    recommendedActions.immediate = [
      { action: 'Review test results with your child' },
      { action: 'Identify specific areas for improvement' },
      { action: 'Create a study plan together' },
    ];
  }

  // Default learning plan if none
  if (recommendedActions.learningPlan.length === 0) {
    recommendedActions.learningPlan = [{
      focus: 'General Review',
      duration: '2 weeks',
      timeCommitment: '20 minutes daily',
      successMetric: 'Improved confidence in subject',
    }];
  }

  // Transform weaknesses to error analysis
  const errorAnalysis = weaknesses.slice(0, 5).map((weakness, idx) => ({
    errorTypeHuman: `Area ${idx + 1}`,
    frequency: 1,
    examples: [{
      wrong: weakness,
      correct: 'See recommendations for improvement strategies',
    }],
    explanation: weakness,
    rule: 'Practice and review required',
  }));

  // Default error analysis if none
  if (errorAnalysis.length === 0) {
    errorAnalysis.push({
      errorTypeHuman: 'General Review Needed',
      frequency: 1,
      examples: [{ wrong: 'Some areas need improvement', correct: 'Focus on weak areas' }],
      explanation: 'Continue practicing and reviewing material',
      rule: 'Consistent practice leads to improvement',
    });
  }

  // Transform strengths
  const strengthsIdentified = strengths.slice(0, 5).map((strength, idx) => ({
    strengthType: `Strength ${idx + 1}`,
    description: strength,
  }));

  // Default strengths if none
  if (strengthsIdentified.length === 0) {
    strengthsIdentified.push({
      strengthType: 'Effort',
      description: 'Completed the test and showed willingness to learn',
    });
  }

  return {
    header,
    examStructure,
    scores,
    fairnessAssessment,
    riskAssessment,
    recommendedActions,
    errorAnalysis,
    strengthsIdentified,
  };
}
