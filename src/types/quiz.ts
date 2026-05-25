export type QuestionType = 'single' | 'multiple';
export type QuizStatus = 'draft' | 'published';

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  answers: AnswerOption[];
}

export interface Quiz {
  id: string;
  ownerId: string;
  title: string;
  questions: Question[];
  status: QuizStatus;
  permalink?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface QuizAttemptAnswer {
  questionId: string;
  selectedAnswerIds: string[];
}

export interface QuizScore {
  correct: number;
  total: number;
}
