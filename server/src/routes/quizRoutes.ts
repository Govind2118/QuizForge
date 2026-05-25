import { Router } from 'express';
import { z } from 'zod';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/http.js';
import { attemptSchema } from '../services/validators.js';
import * as quizService from '../services/quizService.js';

const idParamSchema = z.object({ id: z.string().min(1).max(120) });
const permalinkParamSchema = z.object({ permalink: z.string().regex(/^[A-Za-z0-9]{6}$/, 'Quiz link must be 6 alphanumeric characters.') });

export const quizRouter = Router();
export const publicQuizRouter = Router();

quizRouter.use(authenticate);

quizRouter.get('/', asyncHandler(async (req, res) => {
  const ownerId = (req as AuthenticatedRequest).user.uid;
  const quizzes = await quizService.listMyQuizzes(ownerId);
  res.json(quizzes);
}));

quizRouter.post('/', asyncHandler(async (req, res) => {
  const ownerId = (req as AuthenticatedRequest).user.uid;
  const quiz = await quizService.createQuiz(ownerId);
  res.status(201).json(quiz);
}));

quizRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const ownerId = (req as AuthenticatedRequest).user.uid;
  const quiz = await quizService.getOwnedQuiz(ownerId, id);
  res.json(quiz);
}));

quizRouter.put('/:id', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const ownerId = (req as AuthenticatedRequest).user.uid;
  const quiz = await quizService.updateQuiz(ownerId, id, req.body);
  res.json(quiz);
}));

quizRouter.post('/:id/publish', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const ownerId = (req as AuthenticatedRequest).user.uid;
  const quiz = await quizService.publishQuiz(ownerId, id);
  res.json(quiz);
}));

quizRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const ownerId = (req as AuthenticatedRequest).user.uid;
  await quizService.deleteQuiz(ownerId, id);
  res.status(204).send();
}));

publicQuizRouter.get('/:permalink', asyncHandler(async (req, res) => {
  const { permalink } = permalinkParamSchema.parse(req.params);
  const quiz = await quizService.getPublishedQuiz(permalink);
  res.json(quiz);
}));

publicQuizRouter.post('/:permalink/score', asyncHandler(async (req, res) => {
  const { permalink } = permalinkParamSchema.parse(req.params);
  const input = attemptSchema.parse(req.body);
  const score = await quizService.scoreQuiz(permalink, input.answers);
  res.json(score);
}));
