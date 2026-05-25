import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useAppSelector } from '@/app/hooks';

export function NotFoundPage() {
  const session = useAppSelector((state) => state.auth.session);
  return (
    <main className="container page-header stack">
      <section className="card stack quiz-error-card">
        <div className="quiz-error-icon" aria-hidden="true"><MagnifyingGlassIcon width={32} height={32} /></div>
        <h1 className="title-lg">Page not found</h1>
        <p className="muted">This route does not exist. Head back to your workspace or the landing page.</p>
        <Link className="button primary" to={session ? '/dashboard' : '/'}>{session ? 'Back to dashboard' : 'Go home'}</Link>
      </section>
    </main>
  );
}
