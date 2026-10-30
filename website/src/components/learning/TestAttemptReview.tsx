import type { AttemptReview } from "@/lib/testAttemptReview";

/** Shared by the saved-result route and an inline tutorial attempt. */
export function TestAttemptReview({ review, showSummary = true }: { review: AttemptReview; showSummary?: boolean }) {
  const { attempt, questions } = review;
  const answers = new Map(review.answers.map((answer) => [answer.question_id, answer.selected_index]));
  return (
    <div className="mt-4 space-y-4">
      {showSummary && <p role="status" className="rounded-xl border border-line bg-card p-4 font-semibold text-ink">
        Score: {attempt.score} / {attempt.total_marks} · Correct: {attempt.correct_count} · Incorrect: {attempt.incorrect_count}
      </p>}
      {questions.map((question, i) => {
        const chosen = answers.get(question.id);
        return (
          <div key={question.id} className="rounded-2xl border border-line bg-card p-4">
            <h3 className="whitespace-pre-wrap font-semibold text-ink">{i + 1}. {question.question_text}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {question.options.map((option, index) => (
                <li key={index} className={`whitespace-pre-wrap break-words rounded-lg border px-3 py-2 ${
                  index === question.correct_index ? "border-success/40 bg-success/10 text-ink" :
                    index === chosen ? "border-danger/40 bg-danger/10 text-ink" : "border-line text-ink-muted"
                }`}>
                  {option}
                  {index === question.correct_index ? " · Correct answer" : ""}
                  {index === chosen ? " · Your answer" : ""}
                </li>
              ))}
            </ul>
            {chosen == null && <p className="mt-2 text-sm text-ink-muted">Not answered.</p>}
            {question.explanation && <p className="mt-3 border-t border-line pt-3 text-sm leading-6 text-ink-muted">{question.explanation}</p>}
          </div>
        );
      })}
    </div>
  );
}
