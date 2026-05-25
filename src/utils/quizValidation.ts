import type { Quiz } from '@/types/quiz';

export interface QuestionValidationError {
  questionId: string;
  messages: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  questionErrors: QuestionValidationError[];
}

export function validateQuizForPublish(quiz: Quiz): ValidationResult {
  const errors: string[] = [];
  const questionErrors: QuestionValidationError[] = [];
  const title = quiz.title.trim();

  if (!title) errors.push('Add a quiz title.');
  if (quiz.questions.length < 1) errors.push('Add at least one question.');
  if (quiz.questions.length > 10) errors.push('A quiz can have no more than 10 questions.');

  quiz.questions.forEach((question) => {
    const messages: string[] = [];

    if (!question.text.trim()) messages.push('Add question text.');
    if (question.answers.length < 1) messages.push('Add at least one answer.');
    if (question.answers.length > 5) messages.push('A question can have no more than 5 answers.');
    if (question.answers.some((answer) => !answer.text.trim())) messages.push('Fill in every answer option.');

    const correctCount = question.answers.filter((answer) => answer.isCorrect).length;
    if (question.type === 'single' && correctCount !== 1) {
      messages.push('Choose exactly one correct answer.');
    }
    if (question.type === 'multiple' && correctCount < 1) {
      messages.push('Choose at least one correct answer.');
    }

    if (messages.length > 0) {
      questionErrors.push({ questionId: question.id, messages });
    }
  });

  return { valid: errors.length === 0 && questionErrors.length === 0, errors, questionErrors };
}
