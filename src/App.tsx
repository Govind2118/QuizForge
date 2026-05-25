import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { bootstrapSession } from '@/features/auth/authSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BuilderPage } from '@/pages/BuilderPage';
import { PublicQuizPage } from '@/pages/PublicQuizPage';
import { PreviewFlowPage } from '@/pages/PreviewFlowPage';
import { AboutPage } from '@/pages/AboutPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

function HomeRoute() {
  const { session, status } = useAppSelector((state) => state.auth);

  if (status === 'idle' || status === 'loading') {
    return <main className="container page-header">Loading…</main>;
  }

  return session ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

export function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomeRoute />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="take/:permalink" element={<PublicQuizPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="preview/:quizId" element={<PreviewFlowPage />} />
          <Route path="builder/:quizId" element={<BuilderPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </ErrorBoundary>
  );
}
