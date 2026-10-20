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
          <p className="eyebrow">뉴스레터</p>
          <h2 id="nl-title">신상품과 시크릿 세일 소식을 가장 먼저 받아보세요.</h2>
        </div>
        {done ? (
          <p className="notice notice-success" role="status">
            구독해 주셔서 감사합니다. (데모: 이메일은 발송·저장되지 않습니다.)
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
                샘플 주소를 사용하세요. 언제든 구독 해지할 수 있습니다.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
