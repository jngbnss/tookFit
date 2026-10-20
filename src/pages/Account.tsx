import { useState, type FormEvent, type ReactElement } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isEmail } from '../lib/validation';
import { useStore } from '../state/store';
import { usePageMeta } from '../components/usePageMeta';

const DISCLAIMER = 'Frontend simulation: no account is created on a server and passwords are never stored.';

function nameFromEmail(email: string) {
  const base = email.split('@')[0].replace(/[._-]+/g, ' ');
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

type Mode = 'sign-in' | 'register' | 'forgot';

export function AuthPage({ mode }: { mode: Mode }) {
  const title = mode === 'sign-in' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Reset password';
  usePageMeta(title);
  const { signIn, user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  if (user && mode !== 'forgot') return <Navigate to="/account" replace />;

  function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (mode === 'register' && name.trim().length < 2) er.name = 'Enter your name.';
    if (!isEmail(email)) er.email = 'Enter a valid email address.';
    if (mode !== 'forgot' && password.length < 8) er.password = 'Password must be at least 8 characters.';
    setErrors(er);
    if (Object.keys(er).length) {
      document.getElementById(`auth-${Object.keys(er)[0]}`)?.focus();
      return;
    }
    if (mode === 'forgot') {
      setSent(true);
      return;
    }
    // Only the display name and email are kept. The password is discarded immediately.
    signIn({ name: mode === 'register' ? name.trim() : nameFromEmail(email), email: email.trim() });
    setPassword('');
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from ?? '/account', { replace: true });
  }

  const field = (key: string, label: string, input: ReactElement) => (
    <div className="field">
      <label htmlFor={`auth-${key}`}>{label}</label>
      {input}
      {errors[key] && (
        <p id={`auth-${key}-error`} className="error-text">
          {errors[key]}
        </p>
      )}
    </div>
  );
  const aria = (key: string) => ({ id: `auth-${key}`, 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `auth-${key}-error` : undefined });

  return (
    <div className="container">
      <div className="auth-card">
        <h1 className="page-title">{title}</h1>
        <p className="notice">{DISCLAIMER}</p>
        {sent ? (
          <div className="stack">
            <p className="notice notice-success" role="status">
              If an account exists for {email}, a reset link would be sent. (Demo: no email is sent.)
            </p>
            <Link to="/account/sign-in" className="btn btn-primary">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="stack" onSubmit={submit} noValidate>
            {mode === 'register' && field('name', 'Name', <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} {...aria('name')} />)}
            {field('email', 'Email', <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...aria('email')} />)}
            {mode !== 'forgot' &&
              field(
                'password',
                'Password',
                <input className="input" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} {...aria('password')} />,
              )}
            <button type="submit" className="btn btn-primary btn-block">
              {mode === 'sign-in' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
            </button>
          </form>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
          {mode !== 'sign-in' && (
            <Link to="/account/sign-in" className="link-underline">
              Sign in
            </Link>
          )}
          {mode !== 'register' && (
            <Link to="/account/register" className="link-underline">
              Create account
            </Link>
          )}
          {mode !== 'forgot' && (
            <Link to="/account/forgot-password" className="link-underline">
              Forgot password?
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccountDashboard() {
  usePageMeta('My account');
  const { user, signOut, orders, wishlist, notify } = useStore();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/account/sign-in" replace state={{ from: '/account' }} />;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <header className="catalog-head">
        <p className="eyebrow">My account</p>
        <h1 className="page-title">Hello, {user.name}.</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Signed in as {user.email}. {DISCLAIMER}
        </p>
      </header>
      <div className="account-grid">
        <Link to="/account/orders" className="tile">
          <span className="eyebrow">Orders</span>
          <span style={{ fontSize: 22 }} className="display">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
          <span className="muted">View order history and status</span>
        </Link>
        <Link to="/wishlist" className="tile">
          <span className="eyebrow">Wishlist</span>
          <span style={{ fontSize: 22 }} className="display">
            {wishlist.length} saved
          </span>
          <span className="muted">Pieces you saved for later</span>
        </Link>
        <Link to="/shipping-returns" className="tile">
          <span className="eyebrow">Help</span>
          <span style={{ fontSize: 22 }} className="display">
            Shipping &amp; returns
          </span>
          <span className="muted">Delivery times and free returns</span>
        </Link>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ marginTop: 32 }}
        onClick={() => {
          signOut();
          notify('You have been signed out.');
          navigate('/');
        }}
      >
        Sign out
      </button>
    </div>
  );
}
