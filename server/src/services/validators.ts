import { z } from 'zod';

const idSchema = z.string().trim().min(1).max(80);

export const answerSchema = z.object({
  id: idSchema,
  text: z.string().trim().min(1, 'Every answer needs text.').max(260, 'Answer text is too long.'),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  id: idSchema,
  text: z.string().trim().min(1, 'Every question needs text.').max(600, 'Question text is too long.'),
  type: z.enum(['single', 'multiple']),
  answers: z.array(answerSchema).min(1, 'Every question needs at least one answer.').max(5, 'A question can have at most 5 answers.'),
}).superRefine((question, ctx) => {
  const answerIds = new Set(question.answers.map((answer) => answer.id));
  if (answerIds.size !== question.answers.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Answer IDs must be unique within each question.', path: ['answers'] });
  }

  const correctCount = question.answers.filter((answer) => answer.isCorrect).length;
  if (question.type === 'single' && correctCount !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Single-answer questions must have exactly one correct answer.', path: ['answers'] });
  }

  if (question.type === 'multiple' && correctCount < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Multiple-answer questions need at least one correct answer.', path: ['answers'] });
  }
});

export const quizDraftInputSchema = z.object({
  title: z.string().trim().min(1, 'Quiz title is required.').max(120, 'Quiz title is too long.'),
  questions: z.array(questionSchema).max(10, 'A quiz can have at most 10 questions.'),
});

export const publishQuizSchema = quizDraftInputSchema.extend({
  questions: z.array(questionSchema).min(1, 'Add at least one question.').max(10, 'A quiz can have at most 10 questions.'),
}).superRefine((quiz, ctx) => {
  const questionIds = new Set(quiz.questions.map((question) => question.id));
  if (questionIds.size !== quiz.questions.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Question IDs must be unique.', path: ['questions'] });
  }
});

const attemptAnswerSchema = z.object({
  questionId: idSchema,
  selectedAnswerIds: z.array(idSchema).max(5),
}).superRefine((answer, ctx) => {
  const selectedIds = new Set(answer.selectedAnswerIds);
  if (selectedIds.size !== answer.selectedAnswerIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selected answer IDs must be unique for each question.', path: ['selectedAnswerIds'] });
  }
});

export const attemptSchema = z.object({
  answers: z.array(attemptAnswerSchema).max(10),
}).superRefine((attempt, ctx) => {
  const questionIds = new Set(attempt.answers.map((answer) => answer.questionId));
  if (questionIds.size !== attempt.answers.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Each question can be answered only once.', path: ['answers'] });
  }
});

export const authInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128, 'Password is too long.'),
  name: z.string().trim().max(80, 'Name is too long.').optional(),
});
