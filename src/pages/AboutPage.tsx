import { EnvelopeClosedIcon, HeartIcon, LightningBoltIcon } from '@radix-ui/react-icons';

export function AboutPage() {
  return (
    <main className="container page-header stack about-page">
      <section className="card stack about-card">
        <span className="brand-mark" aria-hidden="true">
          Q
        </span>
        <div className="stack about-copy">
          <span className="eyebrow">About QuizForge</span>
          <h1 className="title-lg">A polished workspace for building quick, shareable quizzes.</h1>
          <p className="muted">
            QuizForge helps creators draft, preview, publish, and share lightweight quizzes without making the visitor sign in.
            It is designed around fast editing, clean validation, and a smooth quiz-taking experience.
          </p>
          <p className="muted">
            For questions, feedback, or wonderfully unrealistic partnership ideas, reach us at{' '}
            <a className="about-email" href="mailto:hello@quizforge.example"><EnvelopeClosedIcon /> hello@quizforge.example</a>.
          </p>
        </div>
      </section>

      <section className="grid two about-feature-grid">
        <article className="card stack about-mini-card">
          <LightningBoltIcon className="about-feature-icon" />
          <h2 className="title-md">Built for flow</h2>
          <p className="muted text-sm">Move from draft to preview to published link without losing context.</p>
        </article>
        <article className="card stack about-mini-card">
          <HeartIcon className="about-feature-icon" />
          <h2 className="title-md">Friendly by default</h2>
          <p className="muted text-sm">Visitors get a simple quiz experience and instant scoring after submission.</p>
        </article>
      </section>
    </main>
  );
}
