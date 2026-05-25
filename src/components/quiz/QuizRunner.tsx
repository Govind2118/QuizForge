import * as Checkbox from '@radix-ui/react-checkbox';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { CheckIcon } from '@radix-ui/react-icons';
import { useCallback, useMemo, useState } from 'react';
import type { Quiz, QuizAttemptAnswer } from '@/types/quiz';
import { Button } from '@/components/ui/Button';

interface QuizRunnerProps {
  quiz: Quiz;
  onSubmit: (answers: QuizAttemptAnswer[]) => void;
  disabled?: boolean;
}

export function QuizRunner({ quiz, onSubmit, disabled = false }: QuizRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const setSingle = useCallback((questionId: string, answerId: string) => {
    setAnswers((current) => ({ ...current, [questionId]: [answerId] }));
  }, []);

  const toggleMultiple = useCallback((questionId: string, answerId: string, checked: boolean) => {
    setAnswers((current) => {
      const existing = new Set(current[questionId] ?? []);
      if (checked) existing.add(answerId);
      else existing.delete(answerId);
      return { ...current, [questionId]: [...existing] };
    });
  }, []);

  const answeredCount = useMemo(
    () => quiz.questions.filter((question) => (answers[question.id]?.length ?? 0) > 0).length,
    [answers, quiz.questions],
  );

  const complete = answeredCount === quiz.questions.length;

  const handleSubmit = useCallback(() => {
    onSubmit(
      Object.entries(answers).map(([questionId, selectedAnswerIds]) => ({
        questionId,
        selectedAnswerIds,
      })),
    );
  }, [answers, onSubmit]);

  return (
    <div className="quiz-runner stack">
      <div className="quiz-progress card" aria-label="Quiz progress">
        <div className="between">
          <span className="text-sm muted">Progress</span>
          <strong>{answeredCount}/{quiz.questions.length} answered</strong>
        </div>
        <div className="quiz-progress-track" aria-hidden="true">
          <span style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }} />
        </div>
      </div>
      {quiz.questions.map((question, index) => (
        <section className="card stack quiz-question-card" key={question.id}>
          <div className="between quiz-question-header">
            <h2 className="title-md quiz-question-title">{index + 1}. {question.text}</h2>
            <span className="badge quiz-question-badge">{question.type === 'single' ? 'Choose one' : 'Select all that apply'}</span>
          </div>
          {question.type === 'single' ? (
            <RadioGroup.Root value={answers[question.id]?.[0] ?? ''} onValueChange={(value) => setSingle(question.id, value)} className="stack quiz-answer-list">
              {question.answers.map((answer) => (
                <label className="quiz-answer quiz-option" key={answer.id}>
                  <RadioGroup.Item className="radio-root" value={answer.id}>
                    <RadioGroup.Indicator className="radio-indicator" />
                  </RadioGroup.Item>
                  <span className="quiz-answer-text">{answer.text}</span>
                </label>
              ))}
            </RadioGroup.Root>
          ) : (
            <div className="stack quiz-answer-list">
              {question.answers.map((answer) => (
                <label className="quiz-answer quiz-option" key={answer.id}>
                  <Checkbox.Root className="checkbox-root" checked={(answers[question.id] ?? []).includes(answer.id)} onCheckedChange={(checked) => toggleMultiple(question.id, answer.id, Boolean(checked))}>
                    <Checkbox.Indicator><CheckIcon /></Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="quiz-answer-text">{answer.text}</span>
                </label>
              ))}
            </div>
          )}
        </section>
      ))}
      <Button
        disabled={!complete || disabled}
        onClick={handleSubmit}
      >
        {disabled ? 'Submitting…' : 'Submit answers'}
      </Button>
      {!complete ? <p className="muted text-sm">Answer each question before submitting.</p> : null}
    </div>
  );
}
