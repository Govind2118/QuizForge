import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Quiz, QuizScore, QuizAttemptAnswer } from '@/types/quiz';
import { getPublishedQuiz, scoreQuiz } from '@/api/quizApi';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { useAppSelector } from '@/app/hooks';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export function PublicQuizPage() {
  const { permalink } = useParams();
  const session = useAppSelector((state) => state.auth.session);
  const homePath = useMemo(() => (session ? '/dashboard' : '/'), [session]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [score, setScore] = useState<QuizScore | null>(null);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    if (!permalink || permalink === 'demo') {
      setError(permalink === 'demo' ? 'Create and publish a quiz to preview a real visitor link.' : 'Missing quiz link.');
      return;
    }
    getPublishedQuiz(permalink).then(setQuiz).catch((reason: Error) => setError(reason.message));
  }, [permalink]);

  const handleSubmit = useCallback(async (answers: QuizAttemptAnswer[]) => {
    if (!permalink) return;
    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      setScore(await scoreQuiz(permalink, answers));
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Unable to score your answers.');
    } finally {
      setIsSubmitting(false);
    }
  }, [permalink]);

  if (error) {
    return (
      <main className="container page-header stack public-quiz-page">
        <section className="card stack quiz-error-card">
          <div className="quiz-error-icon" aria-hidden="true"><ExclamationTriangleIcon width={32} height={32} /></div>
          <h1 className="title-lg">Quiz unavailable</h1>
          <p className="muted">{error}</p>
          <Link className="button primary" to={homePath}>Go home</Link>
        </section>
      </main>
    );
  }

  if (!quiz) return <main className="container page-header public-quiz-page">Loading quiz…</main>;

  return (
    <main className="container page-header stack public-quiz-page">
      <section className="card stack public-quiz-intro">
        <span className="eyebrow">Visitor quiz</span>
        <h1 className="workspace-title public-quiz-title">{quiz.title}</h1>
        <p className="muted">Single-answer questions allow one choice. Multi-answer questions require every correct option to count.</p>
      </section>
      {score ? (
        <section className="card stack">
          <span className="eyebrow">Result</span>
          <h2 className="title-lg">You answered {score.correct}/{score.total} questions correctly.</h2>
          <Link className="button secondary" to={homePath}>Return to the home page</Link>
        </section>
      ) : (
        <>
          <QuizRunner quiz={quiz} onSubmit={handleSubmit} disabled={isSubmitting} />
          {submitError ? <p className="error text-sm">{submitError}</p> : null}
        </>
      )}
    </main>
  );
}
