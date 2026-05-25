import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ExitIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';

type AppTheme = 'light' | 'dark';

function getInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = window.localStorage.getItem('quizforge-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppLayout() {
  const session = useAppSelector((state) => state.auth.session);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const accountName = useMemo(
    () => session?.user.name?.trim() || session?.user.email.split('@')[0] || 'Account',
    [session?.user.email, session?.user.name],
  );
  const accountInitial = useMemo(() => accountName.charAt(0).toUpperCase(), [accountName]);
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('quizforge-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/');
  }, [dispatch, navigate]);

  const handleRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="container between">
          <Link className="brand" to={session ? "/dashboard" : "/"}>
            <span className="brand-mark">Q</span>
            <span className="brand-word">QuizForge</span>
          </Link>
          <nav className="cluster">
            {session ? (
              <>
                <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                <NavLink to="/about" className="nav-link">About</NavLink>
                <button
                  type="button"
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-pressed={theme === 'dark'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <span className="theme-toggle-track" aria-hidden="true">
                    <span className="theme-toggle-thumb">{theme === 'dark' ? '☾' : '☀'}</span>
                  </span>
                </button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="button secondary account-trigger" aria-label="Account menu">
                      <span className="account-avatar" aria-hidden="true">{accountInitial}</span>
                      <span className="account-label">Account</span>
                      <ChevronDownIcon className="account-chevron" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="dropdown-content account-menu" align="end" sideOffset={10}>
                      <div className="account-menu-header">
                        <span className="account-avatar menu-avatar" aria-hidden="true">{accountInitial}</span>
                        <div className="account-menu-copy">
                          <strong>{accountName}</strong>
                          <span>{session.user.email}</span>
                        </div>
                      </div>
                      <DropdownMenu.Separator className="dropdown-separator" />
                      <DropdownMenu.Item className="dropdown-item" onSelect={handleLogout}><ExitIcon /> Sign out</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            ) : (
              <>
                <NavLink to="/login" className="muted text-sm nav-auth-link">Sign in</NavLink>
                <button
                  type="button"
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-pressed={theme === 'dark'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <span className="theme-toggle-track" aria-hidden="true">
                    <span className="theme-toggle-thumb">{theme === 'dark' ? '☾' : '☀'}</span>
                  </span>
                </button>
                <Button onClick={handleRegister}>Create account</Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
