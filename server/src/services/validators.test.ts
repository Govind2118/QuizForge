import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { attemptSchema, authInputSchema, publishQuizSchema, quizDraftInputSchema } from './validators.js';

const validQuestion = {
  id: 'q1',
  text: 'What is 2 + 2?',
  type: 'single' as const,
  answers: [
    { id: 'a1', text: '4', isCorrect: true },
    { id: 'a2', text: '5', isCorrect: false },
  ],
};

describe('validators', () => {
  describe('quiz draft validation', () => {
    it('accepts valid draft quizzes, including empty draft question lists', () => {
      expect(quizDraftInputSchema.parse({ title: 'Draft', questions: [] })).toEqual({ title: 'Draft', questions: [] });
      expect(quizDraftInputSchema.parse({ title: 'Draft', questions: [validQuestion] }).questions).toHaveLength(1);
    });

    it('rejects empty titles, empty answer text, and too many answers', () => {
      const result = quizDraftInputSchema.safeParse({
        title: ' ',
        questions: [{ ...validQuestion, answers: Array.from({ length: 6 }, (_, index) => ({ id: `a${index}`, text: index === 0 ? '' : 'Answer', isCorrect: index === 1 })) }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages).toContain('Quiz title is required.');
        expect(messages).toContain('Every answer needs text.');
        expect(messages).toContain('A question can have at most 5 answers.');
      }
    });

    it('rejects duplicate answer ids and invalid correct-answer counts', () => {
      const result = quizDraftInputSchema.safeParse({
        title: 'Draft',
        questions: [{
          ...validQuestion,
          answers: [
            { id: 'same', text: 'A', isCorrect: true },
            { id: 'same', text: 'B', isCorrect: true },
          ],
        }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages).toContain('Answer IDs must be unique within each question.');
        expect(messages).toContain('Single-answer questions must have exactly one correct answer.');
      }
    });
  });

  describe('publish validation', () => {
    it('requires at least one question and unique question ids', () => {
      expect(() => publishQuizSchema.parse({ title: 'Quiz', questions: [] })).toThrow(ZodError);

      const result = publishQuizSchema.safeParse({
        title: 'Quiz',
        questions: [validQuestion, { ...validQuestion, text: 'Different text' }],
      });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toContain('Question IDs must be unique.');
    });

    it('allows multiple-answer questions with one or more correct answers', () => {
      const parsed = publishQuizSchema.parse({
        title: 'Quiz',
        questions: [{
          ...validQuestion,
          id: 'q-multi',
          type: 'multiple',
          answers: [
            { id: 'a1', text: 'Kelvin', isCorrect: true },
            { id: 'a2', text: 'Celsius', isCorrect: true },
            { id: 'a3', text: 'Liters', isCorrect: false },
          ],
        }],
      });

      expect(parsed.questions[0]?.type).toBe('multiple');
    });
  });

  describe('attempt validation', () => {
    it('accepts a normal quiz attempt payload', () => {
      expect(attemptSchema.parse({ answers: [{ questionId: 'q1', selectedAnswerIds: ['a1'] }] })).toEqual({
        answers: [{ questionId: 'q1', selectedAnswerIds: ['a1'] }],
      });
    });

    it('rejects duplicate selected answer ids and duplicate question ids', () => {
      const result = attemptSchema.safeParse({
        answers: [
          { questionId: 'q1', selectedAnswerIds: ['a1', 'a1'] },
          { questionId: 'q1', selectedAnswerIds: ['a2'] },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages).toContain('Selected answer IDs must be unique for each question.');
        expect(messages).toContain('Each question can be answered only once.');
      }
    });
  });

  describe('auth validation', () => {
    it('normalizes email and validates password length', () => {
      expect(authInputSchema.parse({ email: 'USER@Example.COM ', password: 'password123' }).email).toBe('user@example.com');
      expect(() => authInputSchema.parse({ email: 'bad-email', password: 'short' })).toThrow(ZodError);
    });
  });
});
