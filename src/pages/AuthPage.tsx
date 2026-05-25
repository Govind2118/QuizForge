import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearAuthError, login, register } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, status, error } = useAppSelector((state) => state.auth);
  const from = useMemo(
    () => (location.state as { from?: string } | null)?.from ?? '/dashboard',
    [location.state],
  );

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, mode]);

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [from, navigate, session]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'login') await dispatch(login({ email, password }));
    else await dispatch(register({ email, password, name }));
  }, [dispatch, email, mode, name, password]);

  return (
    <main className="container auth-panel">
      <form className="card auth-card stack" onSubmit={handleSubmit}>
        <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create account'}</span>
        <h1 className="title-lg">{mode === 'login' ? 'Sign in to manage quizzes' : 'Start building quizzes'}</h1>
        {mode === 'register' ? <Field label="Name"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" /></Field> : null}
        <Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></Field>
        <Field label="Password" hint="Use at least 8 characters."><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></Field>
        {error ? <p className="error text-sm">{error}</p> : null}
        <Button disabled={status === 'loading'}>{status === 'loading' ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
        <p className="muted text-sm">
          {mode === 'login' ? <>No account? <Link className="auth-switch-link" to="/register">Register</Link></> : <>Already registered? <Link className="auth-switch-link" to="/login">Sign in</Link></>}
        </p>
      </form>
    </main>
  );
}
