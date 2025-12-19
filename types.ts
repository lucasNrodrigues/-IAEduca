
export interface Question {
  id: string;
  type: 'multiple' | 'open';
  question: string;
  options?: string[];
  correctAnswer: string;
  weight: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: string;
  date: string;
  schoolName: string;
  teacherName: string;
  questions: Question[];
  instructions: string;
}

export interface CorrectionResult {
  score: number;
  maxScore: number;
  feedback: string;
  detailedCorrection: {
    questionIndex: number;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
    comment: string;
  }[];
}

export interface UserSettings {
  teacherName: string;
  schoolName: string;
  defaultInstructions: string;
}

export type ViewState = 'dashboard' | 'create' | 'edit' | 'correct' | 'print' | 'settings';
