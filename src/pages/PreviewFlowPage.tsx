import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EyeOpenIcon, RocketIcon } from '@radix-ui/react-icons';
import { useAppSelector } from '@/app/hooks';
import { getQuiz } from '@/api/quizApi';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import type { Quiz, QuizAttemptAnswer, QuizScore } from '@/types/quiz';
import { scoreQuizAttempt } from '@/utils/scoreQuiz';

export function PreviewFlowPage() {
  const { quizId } = useParams();
  const user = useAppSelector((state) => state.auth.session?.user);
  const currentQuiz = useAppSelector((state) => state.quizzes.current);
  const cachedQuiz = useAppSelector((state) => state.quizzes.items.find((quiz) => quiz.id === quizId));
  const [quiz, setQuiz] = useState<Quiz | null>(cachedQuiz ?? (currentQuiz?.id === quizId ? currentQuiz : null) ?? null);
  const [isLoading, setIsLoading] = useState(!quiz);
  const [error, setError] = useState<string>();
  const [score, setScore] = useState<QuizScore | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!user || !quizId) {
      setIsLoading(false);
      setError('Choose a quiz from your dashboard to preview the visitor flow.');
      return;
    }

    const localQuiz = currentQuiz?.id === quizId ? currentQuiz : cachedQuiz;
    if (localQuiz) {
      setQuiz(localQuiz);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    setIsLoading(true);
    getQuiz(quizId)
      .then((item) => {
        if (!isMounted) return;
        setQuiz(item);
        setError(undefined);
      })
      .catch((reason: Error) => {
        if (!isMounted) return;
        setQuiz(null);
        setError(reason.message || 'Unable to load this quiz for preview.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cachedQuiz, currentQuiz, quizId, user]);

  useEffect(() => {
    setScore(null);
  }, [quiz?.id]);

  const handleSubmit = useCallback((answers: QuizAttemptAnswer[]) => {
    if (!quiz) return;
    setScore(scoreQuizAttempt(quiz, answers));
  }, [quiz]);

  const handleTryAgain = useCallback(() => {
    setScore(null);
  }, []);

  if (isLoading) return <main className="container page-header">Loading preview…</main>;

  if (error || !quiz) {
    return (
      <main className="container page-header stack">
        <section className="card stack quiz-error-card">
          <div className="quiz-error-icon" aria-hidden="true"><EyeOpenIcon width={32} height={32} /></div>
          <h1 className="title-lg">Preview unavailable</h1>
          <p className="muted">{error || 'This quiz could not be found.'}</p>
          <Link className="button primary" to="/dashboard">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <main className="container page-header stack">
        <section className="card stack quiz-error-card">
          <div className="quiz-error-icon" aria-hidden="true"><RocketIcon width={32} height={32} /></div>
          <h1 className="title-lg">Add questions to preview</h1>
          <p className="muted">“{quiz.title}” exists, but it needs at least one question before the visitor flow can run.</p>
          <Link className="button primary" to={`/builder/${quiz.id}`}>Open quiz builder</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container page-header stack preview-page">
      <section className="card stack">
        <span className="eyebrow">Preview flow</span>
        <h1 className="workspace-title">{quiz.title}</h1>
        <p className="muted">
          This is a private preview of the visitor experience for this {quiz.status === 'published' ? 'published quiz' : 'draft quiz'}.
          {quiz.status === 'published' && quiz.permalink ? ` Public link: /take/${quiz.permalink}` : ' Publish it when you are ready to generate a shareable link.'}
        </p>
      </section>

      {score ? (
        <section className="card stack">
          <span className="eyebrow">Preview result</span>
          <h2 className="title-lg">You answered {score.correct}/{score.total} questions correctly.</h2>
          <div className="cluster">
            <button type="button" className="button primary" onClick={handleTryAgain}>Try again</button>
            <Link className="button secondary" to={`/dashboard`}>Return to Dashboard</Link>
          </div>
        </section>
      ) : (
        <QuizRunner quiz={quiz} onSubmit={handleSubmit} />
      )}
    </main>
  );
}
