import type { Quiz, QuizAttemptAnswer, QuizScore } from '@/types/quiz';

export function scoreQuizAttempt(quiz: Quiz, answers: QuizAttemptAnswer[]): QuizScore {
  const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswerIds]));

  const correct = quiz.questions.reduce((count, question) => {
    const selected = new Set(answersByQuestion.get(question.id) ?? []);
    const validAnswerIds = new Set(question.answers.map((answer) => answer.id));
    if ([...selected].some((answerId) => !validAnswerIds.has(answerId))) return count;

    const correctIds = question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.id);
    const isCorrect = selected.size === correctIds.length && correctIds.every((id) => selected.has(id));
    return count + (isCorrect ? 1 : 0);
  }, 0);

  return { correct, total: quiz.questions.length };
}
