import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCopyIcon, EyeOpenIcon, TrashIcon } from '@radix-ui/react-icons';
import type { Quiz } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/toastContext';

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => void;
}

export function QuizCard({ quiz, onDelete }: QuizCardProps) {
  const { notify } = useToast();
  const isPublished = quiz.status === 'published';
  const publicPath = quiz.permalink ? `/take/${quiz.permalink}` : undefined;
  const lastUpdated = useMemo(() => new Date(quiz.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }), [quiz.updatedAt]);

  const handleDelete = useCallback(() => {
    onDelete(quiz.id);
  }, [onDelete, quiz.id]);

  const handleCopyLink = useCallback(async () => {
    if (!publicPath) return;
    const link = `${window.location.origin}${publicPath}`;
    try {
      await navigator.clipboard.writeText(link);
      notify('Public link copied', link);
    } catch {
      notify('Copy failed', 'Select and copy the public link manually.');
    }
  }, [notify, publicPath]);

  return (
    <article className="card hoverable quiz-card">
      <div className="quiz-card-body">
        <div className="quiz-card-topline">
          <span className={`badge ${isPublished ? 'success' : 'warning'}`}>{isPublished ? 'Published' : 'Draft'}</span>
          <span className="muted text-sm">Updated {lastUpdated}</span>
        </div>
        <h3 className="title-md quiz-card-title">{quiz.title}</h3>
        <p className="muted text-sm quiz-card-count">
          {quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'} · {isPublished ? 'Read-only' : 'Editable draft'}
        </p>

        <div className="quiz-card-public-slot" aria-hidden={!isPublished || !publicPath}>
          {isPublished && publicPath ? (
            <div className="quiz-card-public-link">
              <span className="muted text-sm">Public link</span>
              <strong>{publicPath}</strong>
              <button type="button" className="copy-link-button" onClick={handleCopyLink} aria-label="Copy public quiz link">
                <ClipboardCopyIcon />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="quiz-card-actions">
        <div className="quiz-action-row quiz-action-row-primary">
          {isPublished && publicPath ? (
            <Link className="button primary quiz-action-button" to={publicPath}>
              Open public quiz
            </Link>
          ) : (
            <Link className="button primary quiz-action-button" to={`/builder/${quiz.id}`}>
              Edit quiz
            </Link>
          )}
        </div>

        <div className="quiz-action-row quiz-action-row-secondary">
          <Link className="button secondary quiz-action-button" to={`/preview/${quiz.id}`}>
            <EyeOpenIcon /> Preview flow
          </Link>
          <ConfirmDialog
            title="Delete this quiz?"
            description={`This will permanently delete “${quiz.title}”. Published links will stop working immediately.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            trigger={(
              <Button className="quiz-action-button" variant="danger">
                <TrashIcon /> Delete
              </Button>
            )}
          />
        </div>
      </div>
    </article>
  );
}
