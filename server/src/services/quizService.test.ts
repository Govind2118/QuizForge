import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import type { Question, Quiz } from '../types.js';
import { mockDb, resetMockDb } from '../test/firestoreMock.js';
import { ApiError } from '../utils/http.js';

let permalinkCounter = 0;
let permalinkQueue: string[] = [];

vi.mock('../config/firebase.js', () => ({
  db: mockDb,
}));

vi.mock('../utils/permalink.js', () => ({
  generatePermalink: () => {
    const queuedPermalink = permalinkQueue.shift();
    if (queuedPermalink) return queuedPermalink;

    permalinkCounter += 1;
    return `pub${String(permalinkCounter).padStart(3, '0')}`.slice(0, 6);
  },
}));

const {
  createQuiz,
  deleteQuiz,
  getOwnedQuiz,
  getPublishedQuiz,
  listMyQuizzes,
  publishQuiz,
  scoreQuiz,
  updateQuiz,
} = await import('./quizService.js');

const OWNER_A = 'owner-a';
const OWNER_B = 'owner-b';

function sampleQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    text: 'What is 2 + 2?',
    type: 'single',
    answers: [
      { id: 'a1', text: '4', isCorrect: true },
      { id: 'a2', text: '5', isCorrect: false },
    ],
    ...overrides,
  };
}

function validDraftBody(title = 'My quiz', questions: Question[] = [sampleQuestion()]) {
  return { title, questions };
}

async function seedDraft(ownerId: string, overrides: Partial<Quiz> = {}) {
  const quiz = await createQuiz(ownerId);
  return updateQuiz(ownerId, quiz.id, validDraftBody(overrides.title ?? 'My quiz', overrides.questions ?? [sampleQuestion()]));
}

describe('quizService', () => {
  beforeEach(() => {
    resetMockDb();
    permalinkCounter = 0;
    permalinkQueue = [];
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createQuiz', () => {
    it('creates an untitled draft for the owner', async () => {
      const quiz = await createQuiz(OWNER_A);

      expect(quiz.ownerId).toBe(OWNER_A);
      expect(quiz.title).toBe('Untitled quiz');
      expect(quiz.status).toBe('draft');
      expect(quiz.questions).toEqual([]);
      expect(quiz.createdAt).toBe(quiz.updatedAt);
    });
  });

  describe('getOwnedQuiz', () => {
    it('returns a quiz owned by the requester', async () => {
      const created = await createQuiz(OWNER_A);
      const quiz = await getOwnedQuiz(OWNER_A, created.id);
      expect(quiz.id).toBe(created.id);
    });

    it('throws when the quiz does not exist', async () => {
      await expect(getOwnedQuiz(OWNER_A, 'missing')).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_NOT_FOUND',
      });
    });

    it('throws when the quiz belongs to another owner', async () => {
      const created = await createQuiz(OWNER_A);
      await expect(getOwnedQuiz(OWNER_B, created.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_NOT_FOUND',
      });
    });
  });

  describe('updateQuiz', () => {
    it('updates title and questions on a draft', async () => {
      const created = await createQuiz(OWNER_A);
      const updated = await updateQuiz(OWNER_A, created.id, validDraftBody('Updated title'));

      expect(updated.title).toBe('Updated title');
      expect(updated.questions).toHaveLength(1);
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('rejects updates from a non-owner', async () => {
      const created = await createQuiz(OWNER_A);
      await expect(updateQuiz(OWNER_B, created.id, validDraftBody())).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_NOT_FOUND',
      });
    });

    it('rejects updates to a published quiz', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);

      await expect(updateQuiz(OWNER_A, published.id, validDraftBody('New title'))).rejects.toMatchObject({
        statusCode: 409,
        code: 'PUBLISHED_READ_ONLY',
      });
    });

    it('rejects invalid draft payloads', async () => {
      const created = await createQuiz(OWNER_A);
      await expect(updateQuiz(OWNER_A, created.id, { title: '', questions: [] })).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe('listMyQuizzes', () => {
    it('returns only quizzes for the owner ordered by updatedAt desc', async () => {
      vi.useFakeTimers();

      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const first = await createQuiz(OWNER_A);
      vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
      const second = await createQuiz(OWNER_A);
      await createQuiz(OWNER_B);

      vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));
      await updateQuiz(OWNER_A, first.id, validDraftBody('First'));
      vi.setSystemTime(new Date('2026-01-01T00:00:03.000Z'));
      await updateQuiz(OWNER_A, second.id, validDraftBody('Second'));

      const quizzes = await listMyQuizzes(OWNER_A);
      expect(quizzes).toHaveLength(2);
      expect(quizzes.every((quiz) => quiz.ownerId === OWNER_A)).toBe(true);
      expect(quizzes.map((quiz) => quiz.id)).toEqual([second.id, first.id]);
    });
  });

  describe('publishQuiz', () => {
    it('publishes a valid draft and assigns a permalink', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);

      expect(published.status).toBe('published');
      expect(published.permalink).toHaveLength(6);
      expect(published.publishedAt).toBeDefined();
    });

    it('returns the existing quiz when already published', async () => {
      const draft = await seedDraft(OWNER_A);
      const first = await publishQuiz(OWNER_A, draft.id);
      const second = await publishQuiz(OWNER_A, draft.id);

      expect(second).toEqual(first);
    });

    it('rejects publishing from a non-owner', async () => {
      const draft = await seedDraft(OWNER_A);
      await expect(publishQuiz(OWNER_B, draft.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_NOT_FOUND',
      });
    });

    it('rejects publishing a draft without questions', async () => {
      const draft = await createQuiz(OWNER_A);
      await expect(publishQuiz(OWNER_A, draft.id)).rejects.toBeInstanceOf(ZodError);
    });

    it('retries permalink generation when a generated code already exists', async () => {
      permalinkQueue = ['abc123', 'abc124'];
      mockDb.collection('permalinks').doc('abc123').set({ quizId: 'other-quiz', createdAt: new Date().toISOString() });
      const draft = await seedDraft(OWNER_A);

      const published = await publishQuiz(OWNER_A, draft.id);

      expect(published.permalink).toBe('abc124');
      const publicQuiz = await getPublishedQuiz('abc124');
      expect(publicQuiz.id).toBe(published.id);
    });

    it('fails cleanly when a unique permalink cannot be reserved', async () => {
      permalinkQueue = Array.from({ length: 18 }, () => 'abc123');
      mockDb.collection('permalinks').doc('abc123').set({ quizId: 'other-quiz', createdAt: new Date().toISOString() });
      const draft = await seedDraft(OWNER_A);

      await expect(publishQuiz(OWNER_A, draft.id)).rejects.toMatchObject({
        statusCode: 500,
        code: 'PERMALINK_COLLISION',
      });
    });

  });

  describe('deleteQuiz', () => {
    it('deletes a draft quiz', async () => {
      const draft = await seedDraft(OWNER_A);
      await deleteQuiz(OWNER_A, draft.id);
      await expect(getOwnedQuiz(OWNER_A, draft.id)).rejects.toMatchObject({ code: 'QUIZ_NOT_FOUND' });
    });

    it('deletes a published quiz and its permalink mapping', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);

      await deleteQuiz(OWNER_A, published.id);

      await expect(getPublishedQuiz(published.permalink!)).rejects.toMatchObject({
        code: 'QUIZ_LINK_NOT_FOUND',
      });
    });

    it('rejects deletion from a non-owner', async () => {
      const draft = await seedDraft(OWNER_A);
      await expect(deleteQuiz(OWNER_B, draft.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_NOT_FOUND',
      });
    });
  });

  describe('getPublishedQuiz', () => {
    it('returns a published quiz without correct-answer flags', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);
      const publicQuiz = await getPublishedQuiz(published.permalink!);

      expect(publicQuiz.ownerId).toBe('');
      expect(publicQuiz.questions[0]?.answers.every((answer) => answer.isCorrect === false)).toBe(true);
    });

    it('throws for an unknown permalink', async () => {
      await expect(getPublishedQuiz('nope00')).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_LINK_NOT_FOUND',
      });
    });

    it('throws when the permalink points at a draft quiz', async () => {
      const draft = await seedDraft(OWNER_A);
      mockDb.collection('permalinks').doc('draft1').set({ quizId: draft.id, createdAt: new Date().toISOString() });

      await expect(getPublishedQuiz('draft1')).rejects.toMatchObject({
        code: 'QUIZ_LINK_NOT_FOUND',
      });
    });

    it('throws a public link error when a permalink points at a missing quiz', async () => {
      mockDb.collection('permalinks').doc('ghost1').set({ quizId: 'missing-quiz', createdAt: new Date().toISOString() });

      await expect(getPublishedQuiz('ghost1')).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_LINK_NOT_FOUND',
      });
    });

  });

  describe('scoreQuiz', () => {
    it('scores fully correct single-answer responses', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);

      const result = await scoreQuiz(published.permalink!, [
        { questionId: 'q1', selectedAnswerIds: ['a1'] },
      ]);

      expect(result).toEqual({ correct: 1, total: 1 });
    });

    it('rejects single-answer attempts with more than one selected option', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);

      await expect(scoreQuiz(published.permalink!, [
        { questionId: 'q1', selectedAnswerIds: ['a1', 'a2'] },
      ])).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_SINGLE_ANSWER',
      });
    });


    it('scores multiple-answer questions only when all correct options are selected', async () => {
      const draft = await seedDraft(OWNER_A, {
        questions: [
          sampleQuestion({
            type: 'multiple',
            answers: [
              { id: 'a1', text: 'A', isCorrect: true },
              { id: 'a2', text: 'B', isCorrect: true },
              { id: 'a3', text: 'C', isCorrect: false },
            ],
          }),
        ],
      });
      const published = await publishQuiz(OWNER_A, draft.id);

      const perfect = await scoreQuiz(published.permalink!, [
        { questionId: 'q1', selectedAnswerIds: ['a1', 'a2'] },
      ]);
      const partial = await scoreQuiz(published.permalink!, [
        { questionId: 'q1', selectedAnswerIds: ['a1'] },
      ]);

      expect(perfect.correct).toBe(1);
      expect(partial.correct).toBe(0);
    });

    it('rejects unknown answer ids instead of silently scoring them', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);

      await expect(scoreQuiz(published.permalink!, [
        { questionId: 'q1', selectedAnswerIds: ['unknown'] },
      ])).rejects.toMatchObject({
        statusCode: 400,
        code: 'UNKNOWN_ANSWER',
      });
    });

    it('rejects incomplete attempts before scoring', async () => {
      const draft = await seedDraft(OWNER_A, {
        questions: [sampleQuestion({ id: 'q1' }), sampleQuestion({ id: 'q2', text: 'Second?' })],
      });
      const published = await publishQuiz(OWNER_A, draft.id);

      await expect(scoreQuiz(published.permalink!, [
        { questionId: 'q1', selectedAnswerIds: ['a1'] },
      ])).rejects.toMatchObject({
        statusCode: 400,
        code: 'INCOMPLETE_ATTEMPT',
      });
    });

    it('rejects attempts with unknown questions', async () => {
      const draft = await seedDraft(OWNER_A);
      const published = await publishQuiz(OWNER_A, draft.id);

      await expect(scoreQuiz(published.permalink!, [
        { questionId: 'missing-question', selectedAnswerIds: ['a1'] },
      ])).rejects.toMatchObject({
        statusCode: 400,
        code: 'UNKNOWN_QUESTION',
      });
    });

    it('throws for an unknown permalink', async () => {
      await expect(scoreQuiz('bad000', [])).rejects.toBeInstanceOf(ApiError);
    });
  });
});
