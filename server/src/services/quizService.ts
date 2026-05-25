import type { Transaction } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import type { Quiz, QuizAttemptAnswer } from '../types.js';
import { ApiError } from '../utils/http.js';
import { generatePermalink } from '../utils/permalink.js';
import { publishQuizSchema, quizDraftInputSchema } from './validators.js';

const quizzes = db.collection('quizzes');
const permalinks = db.collection('permalinks');

function now() {
  return new Date().toISOString();
}

function asQuiz(data: FirebaseFirestore.DocumentData | undefined, id: string): Quiz {
  if (!data) throw new ApiError(404, 'Quiz not found.', 'QUIZ_NOT_FOUND');
  return { id, ...data } as Quiz;
}

function sanitizePublicQuiz(quiz: Quiz): Quiz {
  return {
    ...quiz,
    ownerId: '',
    questions: quiz.questions.map((question) => ({
      ...question,
      answers: question.answers.map((answer) => ({ ...answer, isCorrect: false })),
    })),
  };
}

export async function listMyQuizzes(ownerId: string): Promise<Quiz[]> {
  const snapshot = await quizzes.where('ownerId', '==', ownerId).orderBy('updatedAt', 'desc').get();
  return snapshot.docs.map((doc) => asQuiz(doc.data(), doc.id));
}

export async function createQuiz(ownerId: string): Promise<Quiz> {
  const timestamp = now();
  const ref = quizzes.doc();
  const quiz: Quiz = {
    id: ref.id,
    ownerId,
    title: 'Untitled quiz',
    questions: [],
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await ref.set(quiz);
  return quiz;
}

export async function getOwnedQuiz(ownerId: string, quizId: string): Promise<Quiz> {
  const doc = await quizzes.doc(quizId).get();
  const quiz = asQuiz(doc.data(), doc.id);
  if (quiz.ownerId !== ownerId) throw new ApiError(404, 'Quiz not found.', 'QUIZ_NOT_FOUND');
  return quiz;
}

export async function updateQuiz(ownerId: string, quizId: string, body: unknown): Promise<Quiz> {
  const input = quizDraftInputSchema.parse(body);
  const ref = quizzes.doc(quizId);
  const doc = await ref.get();
  const existing = asQuiz(doc.data(), doc.id);

  if (existing.ownerId !== ownerId) throw new ApiError(404, 'Quiz not found.', 'QUIZ_NOT_FOUND');
  if (existing.status === 'published') throw new ApiError(409, 'Published quizzes cannot be edited.', 'PUBLISHED_READ_ONLY');

  const updated: Quiz = {
    ...existing,
    title: input.title,
    questions: input.questions,
    updatedAt: now(),
  };

  await ref.set(updated);
  return updated;
}

async function reserveUniquePermalink(tx: Transaction, quizId: string): Promise<string> {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const code = generatePermalink();
    const permalinkRef = permalinks.doc(code);
    const existing = await tx.get(permalinkRef);
    if (!existing.exists) {
      tx.create(permalinkRef, { quizId, createdAt: now() });
      return code;
    }
  }
  throw new ApiError(500, 'Could not allocate a unique permalink. Please try again.', 'PERMALINK_COLLISION');
}

export async function publishQuiz(ownerId: string, quizId: string): Promise<Quiz> {
  return db.runTransaction(async (tx) => {
    const ref = quizzes.doc(quizId);
    const doc = await tx.get(ref);
    const existing = asQuiz(doc.data(), doc.id);

    if (existing.ownerId !== ownerId) throw new ApiError(404, 'Quiz not found.', 'QUIZ_NOT_FOUND');
    if (existing.status === 'published') return existing;

    publishQuizSchema.parse({ title: existing.title, questions: existing.questions });

    const timestamp = now();
    const permalink = await reserveUniquePermalink(tx, quizId);
    const published: Quiz = {
      ...existing,
      status: 'published',
      permalink,
      publishedAt: timestamp,
      updatedAt: timestamp,
    };

    tx.set(ref, published);
    return published;
  });
}

export async function deleteQuiz(ownerId: string, quizId: string): Promise<void> {
  await db.runTransaction(async (tx) => {
    const ref = quizzes.doc(quizId);
    const doc = await tx.get(ref);
    const quiz = asQuiz(doc.data(), doc.id);

    if (quiz.ownerId !== ownerId) throw new ApiError(404, 'Quiz not found.', 'QUIZ_NOT_FOUND');
    tx.delete(ref);
    if (quiz.permalink) tx.delete(permalinks.doc(quiz.permalink));
  });
}

async function resolvePublishedQuiz(permalink: string): Promise<Quiz> {
  const permalinkDoc = await permalinks.doc(permalink).get();
  if (!permalinkDoc.exists) throw new ApiError(404, 'This quiz link is invalid or unpublished.', 'QUIZ_LINK_NOT_FOUND');

  const quizId = permalinkDoc.get('quizId') as string | undefined;
  if (!quizId) throw new ApiError(404, 'This quiz link is invalid or unpublished.', 'QUIZ_LINK_NOT_FOUND');

  const quizDoc = await quizzes.doc(quizId).get();
  if (!quizDoc.exists) throw new ApiError(404, 'This quiz link is invalid or unpublished.', 'QUIZ_LINK_NOT_FOUND');

  const quiz = asQuiz(quizDoc.data(), quizDoc.id);
  if (quiz.status !== 'published' || quiz.permalink !== permalink) {
    throw new ApiError(404, 'This quiz link is invalid or unpublished.', 'QUIZ_LINK_NOT_FOUND');
  }

  return quiz;
}

export async function getPublishedQuiz(permalink: string): Promise<Quiz> {
  return sanitizePublicQuiz(await resolvePublishedQuiz(permalink));
}

export async function scoreQuiz(permalink: string, answers: QuizAttemptAnswer[]) {
  const quiz = await resolvePublishedQuiz(permalink);
  const questionsById = new Map(quiz.questions.map((question) => [question.id, question]));
  const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswerIds]));

  if (answers.length !== quiz.questions.length) {
    throw new ApiError(400, 'Every quiz question must be answered before scoring.', 'INCOMPLETE_ATTEMPT');
  }

  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    if (!question) throw new ApiError(400, 'Attempt contains an unknown question.', 'UNKNOWN_QUESTION');

    if (question.type === 'single' && answer.selectedAnswerIds.length !== 1) {
      throw new ApiError(400, 'Single-answer questions must include exactly one selected answer.', 'INVALID_SINGLE_ANSWER');
    }

    if (question.type === 'multiple' && answer.selectedAnswerIds.length < 1) {
      throw new ApiError(400, 'Multiple-answer questions must include at least one selected answer.', 'INVALID_MULTIPLE_ANSWER');
    }

    const validAnswerIds = new Set(question.answers.map((item) => item.id));
    const hasUnknownAnswer = answer.selectedAnswerIds.some((answerId) => !validAnswerIds.has(answerId));
    if (hasUnknownAnswer) throw new ApiError(400, 'Attempt contains an unknown answer option.', 'UNKNOWN_ANSWER');
  }

  const correct = quiz.questions.reduce((count, question) => {
    const selected = new Set(answersByQuestion.get(question.id) ?? []);
    const correctIds = question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.id);
    const isCorrect = selected.size === correctIds.length && correctIds.every((id) => selected.has(id));
    return count + (isCorrect ? 1 : 0);
  }, 0);

  return { correct, total: quiz.questions.length };
}
