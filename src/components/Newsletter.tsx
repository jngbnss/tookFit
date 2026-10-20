import { useState, type FormEvent } from 'react';
import { isEmail } from '../lib/validation';
import { track } from '../lib/analytics';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError('올바른 이메일을 입력해 주세요.');
      return;
    }
    setError('');
    setDone(true);
    track('newsletter_signup');
  }

  return (
    <section className="newsletter" aria-labelledby="nl-title">
      <div className="container newsletter-inner">
        <div>
          <p className="eyebrow">Newsletter</p>
          <h2 id="nl-title">새 컬렉션 소식을 가장 먼저 전해드립니다.</h2>
        </div>
        {done ? (
          <p className="notice notice-success" role="status">
            구독이 완료되었습니다. (데모: 실제 메일은 발송되지 않습니다.)
          </p>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor="nl-email" className="sr-only">
              이메일 주소
            </label>
            <div className="row">
              <input
                id="nl-email"
                className="input"
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'nl-err' : 'nl-note'}
              />
              <button type="submit" className="btn btn-light">
                구독하기
              </button>
            </div>
            {error ? (
              <p id="nl-err" className="error-text" role="alert">
                {error}
              </p>
            ) : (
              <p id="nl-note" style={{ fontSize: 12, color: 'var(--muted)' }}>
                언제든 수신을 해지할 수 있습니다. 샘플 주소를 사용해 주세요.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
