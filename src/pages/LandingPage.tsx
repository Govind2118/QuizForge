import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';

const landingTabs = ['build', 'publish', 'take'] as const;
type LandingTab = (typeof landingTabs)[number];

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<LandingTab>('build');
  const particleIndexes = useMemo(() => Array.from({ length: 64 }, (_, index) => index), []);
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as LandingTab);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveTab((current) => {
        const currentIndex = landingTabs.indexOf(current);
        return landingTabs[(currentIndex + 1) % landingTabs.length];
      });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [activeTab]);

  return (
    <main className="landing-page">
      <div className="landing-aurora" />
      <div className="landing-depth landing-depth-one" />
      <div className="landing-depth landing-depth-two" />
      <div className="landing-particles" aria-hidden="true">
        {particleIndexes.map((index) => (
          <span className="landing-particle" key={index} />
        ))}
      </div>

      <section className="container hero">
        <div className="hero-layout">
          <div className="hero-copy stack">
            <h2 className="eyebrow">REST-ready quiz builder</h2>
            <h2 className="title-xl hero-title">Create polished quizzes. Share them with a six-character link.</h2>
            <p className="hero-lede muted">
              QuizForge is a single-page frontend for authenticated quiz authors and anonymous quiz takers, modeled around REST resources from day one.
            </p>
            <div className="cluster">
              <Link className="button primary" to="/register">Start building</Link>
              <Link className="button secondary" to="/login">Sign in</Link>
            </div>
          </div>

          <div className="card landing-panel">
            <Tabs.Root value={activeTab} onValueChange={handleTabChange} className="tabs-root">
              <Tabs.List className="tabs-list" aria-label="Product highlights">
                <Tabs.Trigger className="tabs-trigger" value="build">Build</Tabs.Trigger>
                <Tabs.Trigger className="tabs-trigger" value="publish">Publish</Tabs.Trigger>
                <Tabs.Trigger className="tabs-trigger" value="take">Take</Tabs.Trigger>
              </Tabs.List>

              <div className="tabs-content-shell">
                <Tabs.Content className="tabs-content" value="build">
                  <span className="panel-kicker">01</span>
                  <div className="tabs-copy">
                    <h2 className="title-lg">Structured authoring</h2>
                    <p className="muted">Draft quizzes with 1-10 questions and 1-5 answers per question.</p>
                  </div>
                </Tabs.Content>

                <Tabs.Content className="tabs-content" value="publish">
                  <span className="panel-kicker">02</span>
                  <div className="tabs-copy">
                    <h2 className="title-lg">Immutable publishing</h2>
                    <p className="muted">Published quizzes become read-only and receive a six-character permalink.</p>
                  </div>
                </Tabs.Content>

                <Tabs.Content className="tabs-content" value="take">
                  <span className="panel-kicker">03</span>
                  <div className="tabs-copy">
                    <h2 className="title-lg">Visitor-friendly attempts</h2>
                    <p className="muted">Anonymous visitors can answer single-choice or multi-select questions and see their score instantly.</p>
                  </div>
                </Tabs.Content>
              </div>
            </Tabs.Root>
          </div>
        </div>
      </section>
    </main>
  );
}
