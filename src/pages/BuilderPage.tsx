import { useCallback, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { CheckCircledIcon, PlusIcon } from '@radix-ui/react-icons';
import type { Quiz, Question } from '@/types/quiz';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchQuiz, publishQuiz, saveQuiz, setCurrentQuizDraft } from '@/features/quizzes/quizzesSlice';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { QuestionEditor } from '@/components/quiz/QuestionEditor';
import { validateQuizForPublish } from '@/utils/quizValidation';
import { useToast } from '@/components/ui/toastContext';

function createQuestion(): Question {
  return {
    id: nanoid(),
    text: '',
    type: 'single',
    answers: [
      { id: nanoid(), text: '', isCorrect: true },
      { id: nanoid(), text: '', isCorrect: false },
    ],
  };
}

export function BuilderPage() {
  const { quizId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notify } = useToast();
  const user = useAppSelector((state) => state.auth.session?.user);
  const quiz = useAppSelector((state) => {
    const { current, currentQuizId } = state.quizzes;
    return current && current.id === quizId && currentQuizId === quizId ? current : undefined;
  });
  const status = useAppSelector((state) => state.quizzes.status);
  const error = useAppSelector((state) => state.quizzes.error);

  useEffect(() => {
    if (quizId && user) dispatch(fetchQuiz(quizId));
  }, [dispatch, quizId, user]);

  const validation = useMemo(() => (quiz ? validateQuizForPublish(quiz) : undefined), [quiz]);
  const questionErrorsById = useMemo(() => {
    const entries = validation?.questionErrors.map((item) => [item.questionId, item.messages] as const) ?? [];
    return new Map(entries);
  }, [validation]);

  const setQuiz = useCallback((next: Quiz) => dispatch(setCurrentQuizDraft(next)), [dispatch]);

  const handleSave = useCallback(async () => {
    if (!quiz) return;
    try {
      await dispatch(saveQuiz(quiz)).unwrap();
      notify('Draft saved', 'Your changes are stored.');
    } catch (reason) {
      notify('Save failed', reason instanceof Error ? reason.message : 'Unable to save this quiz.');
    }
  }, [dispatch, notify, quiz]);

  const handlePublish = useCallback(async () => {
    if (!quiz || !validation?.valid) return;

    try {
      const savedQuiz = await dispatch(saveQuiz(quiz)).unwrap();
      const result = await dispatch(publishQuiz(savedQuiz.id)).unwrap();
      notify('Quiz published', `Share /take/${result.permalink}`);
      navigate('/dashboard');
    } catch (reason) {
      notify('Publish failed', reason instanceof Error ? reason.message : 'Unable to publish this quiz.');
    }
  }, [dispatch, navigate, notify, quiz, validation?.valid]);

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!quiz) return;
      setQuiz({ ...quiz, title: event.target.value });
    },
    [quiz, setQuiz],
  );

  const handleAddQuestion = useCallback(() => {
    if (!quiz) return;
    setQuiz({ ...quiz, questions: [...quiz.questions, createQuestion()] });
  }, [quiz, setQuiz]);

  const handleQuestionChange = useCallback(
    (questionId: string, nextQuestion: Question) => {
      if (!quiz) return;
      setQuiz({
        ...quiz,
        questions: quiz.questions.map((item) => (item.id === questionId ? nextQuestion : item)),
      });
    },
    [quiz, setQuiz],
  );

  const handleQuestionRemove = useCallback(
    (questionId: string) => {
      if (!quiz) return;
      setQuiz({ ...quiz, questions: quiz.questions.filter((item) => item.id !== questionId) });
    },
    [quiz, setQuiz],
  );

  if (status === 'loading' && !quiz) {
    return <main className="container page-header">Loading builder…</main>;
  }

  if (!quiz) {
    return (
      <main className="container page-header stack">
        <section className="card stack">
          <h1 className="title-lg">Quiz unavailable</h1>
          <p className="muted">{error ?? 'This quiz could not be found.'}</p>
          <Link className="button primary" to="/dashboard">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  if (quiz.status === 'published') {
    return (
      <main className="container page-header stack">
        <section className="card stack">
          <h1 className="title-lg">Published quizzes are read-only</h1>
          <p className="muted">This protects shared quizzes from changing after visitors receive the permalink.</p>
          <Link className="button primary" to="/dashboard">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container page-header stack">
      <section className="between">
        <div>
          <span className="eyebrow">Quiz builder</span>
          <h1 className="builder-title">Compose quiz</h1>
        </div>
        <div className="cluster">
          <Button variant="secondary" onClick={handleSave} disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save draft'}</Button>
          <Button onClick={handlePublish} disabled={!validation?.valid || status === 'saving'}><CheckCircledIcon /> Publish</Button>
        </div>
      </section>

      <section className="card stack">
        <Field label="Quiz title">
          <Input value={quiz.title} onChange={handleTitleChange} placeholder="e.g. Science facts warm-up" />
        </Field>
        <div className="cluster">
          <span className="badge">{quiz.questions.length}/10 questions</span>
          <Button
            variant="secondary"
            disabled={quiz.questions.length >= 10}
            onClick={handleAddQuestion}
          >
            <PlusIcon /> Add question
          </Button>
        </div>
      </section>

      {quiz.questions.map((question, index) => (
        <QuestionEditor
          key={question.id}
          question={question}
          index={index}
          errors={questionErrorsById.get(question.id)}
          canRemove={quiz.questions.length > 1}
          onChange={(nextQuestion) => handleQuestionChange(question.id, nextQuestion)}
          onRemove={() => handleQuestionRemove(question.id)}
        />
      ))}

      {validation && validation.errors.length > 0 ? (
        <section className="card stack">
          <h2 className="title-md">Before publishing</h2>
          <ul className="error text-sm">
            {validation.errors.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ) : null}
      {error ? <p className="error text-sm">{error}</p> : null}
    </main>
  );
}
