import * as Checkbox from "@radix-ui/react-checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import * as Select from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  Cross2Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useCallback, type ChangeEvent } from "react";
import { nanoid } from "nanoid";
import type { Question } from "@/types/quiz";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

interface QuestionEditorProps {
  question: Question;
  index: number;
  errors?: string[];
  canRemove?: boolean;
  onChange: (question: Question) => void;
  onRemove: () => void;
}

function normalizeAnswersAfterRemoval(question: Question, answerId: string): Question["answers"] {
  const nextAnswers = question.answers.filter((item) => item.id !== answerId);
  if (question.type === "single" && nextAnswers.length > 0 && !nextAnswers.some((answer) => answer.isCorrect)) {
    return nextAnswers.map((answer, answerIndex) => ({
      ...answer,
      isCorrect: answerIndex === 0,
    }));
  }
  return nextAnswers;
}

export function QuestionEditor({
  question,
  index,
  errors = [],
  canRemove = true,
  onChange,
  onRemove,
}: QuestionEditorProps) {
  const updateAnswer = useCallback(
    (answerId: string, changes: Partial<Question["answers"][number]>) => {
      let nextAnswers = question.answers.map((answer) =>
        answer.id === answerId ? { ...answer, ...changes } : answer,
      );
      if (question.type === "single" && changes.isCorrect) {
        nextAnswers = nextAnswers.map((answer) => ({
          ...answer,
          isCorrect: answer.id === answerId,
        }));
      }
      onChange({ ...question, answers: nextAnswers });
    },
    [onChange, question],
  );

  const setType = useCallback(
    (type: Question["type"]) => {
      const firstCorrectIndex = Math.max(
        0,
        question.answers.findIndex((item) => item.isCorrect),
      );
      const answers =
        type === "single"
          ? question.answers.map((answer, answerIndex) => ({
              ...answer,
              isCorrect: answerIndex === firstCorrectIndex,
            }))
          : question.answers;
      onChange({ ...question, type, answers });
    },
    [onChange, question],
  );

  const handleQuestionTextChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...question, text: event.target.value });
    },
    [onChange, question],
  );

  const handleAddAnswer = useCallback(() => {
    onChange({
      ...question,
      answers: [
        ...question.answers,
        {
          id: nanoid(),
          text: "",
          isCorrect: question.answers.length === 0,
        },
      ],
    });
  }, [onChange, question]);

  const handleRemoveAnswer = useCallback(
    (answerId: string) => {
      onChange({
        ...question,
        answers: normalizeAnswersAfterRemoval(question, answerId),
      });
    },
    [onChange, question],
  );

  return (
    <section className="card stack">
      <div className="between">
        <h3 className="title-md">Question {index + 1}</h3>
        <Button variant="ghost" onClick={onRemove} disabled={!canRemove}>
          <TrashIcon width={20} height={20} /> Remove
        </Button>
      </div>

      <Field label="Question text">
        <Textarea
          value={question.text}
          onChange={handleQuestionTextChange}
          placeholder="What would you like to ask?"
        />
      </Field>

      <Field
        label="Answer behavior"
        hint="Single answer uses radio buttons for visitors; multiple answer uses checkboxes."
      >
        <Select.Root
          value={question.type}
          onValueChange={(value: string) => setType(value as Question["type"])}
        >
          <Select.Trigger className="select-trigger" aria-label="Question type">
            <Select.Value />
            <Select.Icon className="select-icon">
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className="select-content"
              position="popper"
              sideOffset={8}
            >
              <Select.Viewport className="select-viewport">
                <Select.Item className="select-item" value="single">
                  <Select.ItemText>Single correct answer</Select.ItemText>
                  <Select.ItemIndicator className="select-item-indicator">
                    <CheckIcon />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item className="select-item" value="multiple">
                  <Select.ItemText>Multiple correct answers</Select.ItemText>
                  <Select.ItemIndicator className="select-item-indicator">
                    <CheckIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </Field>

      {errors.length > 0 ? (
        <div className="question-error-box" role="alert">
          <strong>Please fix this question</strong>
          <ul>
            {errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="stack">
        <div className="between">
          <strong>Answers</strong>
          <Button
            variant="secondary"
            disabled={question.answers.length >= 5}
            onClick={handleAddAnswer}
          >
            <PlusIcon /> Add answer
          </Button>
        </div>
        {question.answers.map((answer, answerIndex) => (
          <div className="quiz-answer" key={answer.id}>
            <Checkbox.Root
              className="checkbox-root"
              checked={answer.isCorrect}
              onCheckedChange={(checked: CheckedState) =>
                updateAnswer(answer.id, { isCorrect: checked === true })
              }
              aria-label={`Mark answer ${answerIndex + 1} correct`}
            >
              <Checkbox.Indicator className="checkbox-indicator">
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Input
              value={answer.text}
              placeholder={`Answer ${answerIndex + 1}`}
              onChange={(event) =>
                updateAnswer(answer.id, { text: event.target.value })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={question.answers.length <= 1}
              onClick={() => handleRemoveAnswer(answer.id)}
              aria-label="Remove answer"
            >
              <Cross2Icon height={16} width={16} />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
