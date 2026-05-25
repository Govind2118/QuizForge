import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@radix-ui/react-icons';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createQuiz, deleteQuiz, fetchMyQuizzes } from '@/features/quizzes/quizzesSlice';
import { Button } from '@/components/ui/Button';
import { QuizCard } from '@/components/quiz/QuizCard';
import { useToast } from '@/components/ui/toastContext';
import { Skeleton } from '@/components/ui/Skeleton';

const QUIZZES_PER_PAGE = 6;

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notify } = useToast();
  const user = useAppSelector((state) => state.auth.session?.user);
  const { items, status, error } = useAppSelector((state) => state.quizzes);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / QUIZZES_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * QUIZZES_PER_PAGE;
    return items.slice(startIndex, startIndex + QUIZZES_PER_PAGE);
  }, [currentPage, items]);

  const stats = useMemo(() => {
    const published = items.filter((quiz) => quiz.status === 'published').length;
    return {
      total: items.length,
      published,
      draft: items.length - published,
    };
  }, [items]);

  useEffect(() => {
    if (user) dispatch(fetchMyQuizzes());
  }, [dispatch, user]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleCreate = useCallback(async () => {
    try {
      const result = await dispatch(createQuiz()).unwrap();
      navigate(`/builder/${result.id}`);
    } catch (reason) {
      notify('Could not create quiz', reason instanceof Error ? reason.message : 'Please try again.');
    }
  }, [dispatch, navigate, notify]);

  const handleDelete = useCallback(async (quizId: string) => {
    try {
      await dispatch(deleteQuiz(quizId)).unwrap();
      notify('Quiz deleted');
    } catch (reason) {
      notify('Delete failed', reason instanceof Error ? reason.message : 'Unable to delete this quiz.');
    }
  }, [dispatch, notify]);

  return (
    <main className="container page-header stack dashboard-page">
      <section className="between">
        <div className="workspace-heading">
          <span className="eyebrow workspace-kicker">Your workspace</span>
          <h1 className="workspace-title">Your quizzes</h1>
        </div>
        <Button onClick={handleCreate}><PlusIcon /> New quiz</Button>
      </section>
      <section className="workspace-stats grid three" aria-label="Quiz workspace summary">
        <div className="stat-card"><span>Total quizzes</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>Published</span><strong>{stats.published}</strong></div>
        <div className="stat-card"><span>Drafts</span><strong>{stats.draft}</strong></div>
      </section>

      {status === 'loading' ? (
        <div className="grid three" aria-label="Loading quizzes">
          <section className="card quiz-card"><Skeleton lines={5} /></section>
          <section className="card quiz-card"><Skeleton lines={5} /></section>
          <section className="card quiz-card"><Skeleton lines={5} /></section>
        </div>
      ) : null}
      {error ? <p className="error text-sm" role="alert">{error}</p> : null}
      {items.length === 0 && status !== 'loading' ? (
        <section className="card stack">
          <h2 className="title-lg">No quizzes yet</h2>
          <p className="muted">Create your first draft, add questions, then publish it when ready.</p>
          <Button onClick={handleCreate}>Create a quiz</Button>
        </section>
      ) : (
        status !== 'loading' ? (
          <>
            <div className="grid three">
              {paginatedItems.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} onDelete={handleDelete} />)}
            </div>
            {totalPages > 1 ? (
              <nav className="dashboard-pagination" aria-label="Quiz dashboard pagination">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <span className="pagination-status" aria-live="polite">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </>
        ) : null
      )}
    </main>
  );
}
