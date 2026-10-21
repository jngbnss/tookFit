import { useState, type FormEvent, type ReactElement } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isEmail } from '../lib/validation';
import { useStore } from '../state/store';
import { usePageMeta } from '../components/usePageMeta';

const DISCLAIMER = '프론트엔드 시뮬레이션입니다. 서버에 계정이 만들어지지 않으며 비밀번호는 저장되지 않습니다.';

function nameFromEmail(email: string) {
  const base = email.split('@')[0].replace(/[._-]+/g, ' ');
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

type Mode = 'sign-in' | 'register' | 'forgot';

export function AuthPage({ mode }: { mode: Mode }) {
  const title = mode === 'sign-in' ? '로그인' : mode === 'register' ? '회원가입' : '비밀번호 찾기';
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
    if (mode === 'register' && name.trim().length < 2) er.name = '이름을 입력해 주세요.';
    if (!isEmail(email)) er.email = '올바른 이메일을 입력해 주세요.';
    if (mode !== 'forgot' && password.length < 8) er.password = '비밀번호는 8자 이상이어야 합니다.';
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
              {email} 계정이 있다면 재설정 링크가 발송됩니다. (데모: 실제 메일은 발송되지 않습니다.)
            </p>
            <Link to="/account/sign-in" className="btn btn-primary">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form className="stack" onSubmit={submit} noValidate>
            {mode === 'register' && field('name', '이름', <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} {...aria('name')} />)}
            {field('email', '이메일', <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...aria('email')} />)}
            {mode !== 'forgot' &&
              field(
                'password',
                '비밀번호',
                <input className="input" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} {...aria('password')} />,
              )}
            <button type="submit" className="btn btn-primary btn-block">
              {mode === 'sign-in' ? '로그인' : mode === 'register' ? '회원가입' : '재설정 링크 보내기'}
            </button>
          </form>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
          {mode !== 'sign-in' && (
            <Link to="/account/sign-in" className="link-underline">
              로그인
            </Link>
          )}
          {mode !== 'register' && (
            <Link to="/account/register" className="link-underline">
              회원가입
            </Link>
          )}
          {mode !== 'forgot' && (
            <Link to="/account/forgot-password" className="link-underline">
              비밀번호를 잊으셨나요?
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccountDashboard() {
  usePageMeta('마이페이지');
  const { user, signOut, orders, wishlist, notify } = useStore();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/account/sign-in" replace state={{ from: '/account' }} />;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <header className="catalog-head">
        <p className="eyebrow">마이페이지</p>
        <h1 className="page-title">{user.name}님, 안녕하세요.</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {user.email}(으)로 로그인됨. {DISCLAIMER}
        </p>
      </header>
      <div className="account-grid">
        <Link to="/account/orders" className="tile">
          <span className="eyebrow">주문</span>
          <span style={{ fontSize: 22 }} className="display">
            주문 {orders.length}건
          </span>
          <span className="muted">주문 내역과 상태 확인</span>
        </Link>
        <Link to="/wishlist" className="tile">
          <span className="eyebrow">위시리스트</span>
          <span style={{ fontSize: 22 }} className="display">
            {wishlist.length}개 저장
          </span>
          <span className="muted">나중을 위해 저장한 상품</span>
        </Link>
        <Link to="/shipping-returns" className="tile">
          <span className="eyebrow">고객 지원</span>
          <span style={{ fontSize: 22 }} className="display">
            배송 및 반품
          </span>
          <span className="muted">배송 기간과 무료 반품 안내</span>
        </Link>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ marginTop: 32 }}
        onClick={() => {
          signOut();
          notify('로그아웃되었습니다.');
          navigate('/');
        }}
      >
        로그아웃
      </button>
    </div>
  );
}
