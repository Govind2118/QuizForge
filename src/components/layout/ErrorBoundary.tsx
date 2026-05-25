import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ui-error-boundary]', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container page-header stack">
          <section className="card stack quiz-error-card">
            <div className="quiz-error-icon" aria-hidden="true">!</div>
            <h1 className="title-lg">Something went wrong</h1>
            <p className="muted">Refresh the page or return home. Your saved quizzes are stored on the server.</p>
            <Link className="button primary" to="/">Go home</Link>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
