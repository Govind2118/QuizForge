import type { Quiz, QuizAttemptAnswer, QuizScore } from '@/types/quiz';
import { apiRequest } from './client';

export async function listMyQuizzes(): Promise<Quiz[]> {
  return apiRequest<Quiz[]>('/quizzes');
}

export async function getQuiz(id: string): Promise<Quiz> {
  return apiRequest<Quiz>(`/quizzes/${id}`);
}

export async function createQuiz(): Promise<Quiz> {
  return apiRequest<Quiz>('/quizzes', { method: 'POST' });
}

export async function updateQuiz(quiz: Quiz): Promise<Quiz> {
  return apiRequest<Quiz>(`/quizzes/${quiz.id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: quiz.title, questions: quiz.questions }),
  });
}

export async function publishQuiz(quizId: string): Promise<Quiz> {
  return apiRequest<Quiz>(`/quizzes/${quizId}/publish`, { method: 'POST' });
}

export async function deleteQuiz(quizId: string): Promise<void> {
  return apiRequest<void>(`/quizzes/${quizId}`, { method: 'DELETE' });
}

export async function getPublishedQuiz(permalink: string): Promise<Quiz> {
  return apiRequest<Quiz>(`/public/quizzes/${permalink}`, {}, false);
}

export async function scoreQuiz(permalink: string, answers: QuizAttemptAnswer[]): Promise<QuizScore> {
  return apiRequest<QuizScore>(`/public/quizzes/${permalink}/score`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }, false);
}
