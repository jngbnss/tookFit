import { useId, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../domain/types';
import { formatDate } from '../lib/format';
import { ratingSummary } from '../lib/reviews';
import { useStore } from '../state/store';

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="stars" style={{ fontSize: size }} aria-hidden="true">
      <span className="stars-bg">★★★★★</span>
      <span className="stars-fg" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

export function RatingBadge({ product, link = false }: { product: Product; link?: boolean }) {
  const { reviewsFor } = useStore();
  const { average, count } = ratingSummary(reviewsFor(product));
  if (!count) return null;
  const body = (
    <>
      <Stars value={average} />
      <span className="sr-only">별점 5점 만점에 {average}점,</span>
      <span>
        {average.toFixed(1)} <span className="muted">({count})</span>
      </span>
    </>
  );
  return link ? (
    <a href="#reviews" className="rating" onClick={(e) => { e.preventDefault(); document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }); }}>
      {body} <span className="muted">리뷰 보기</span>
    </a>
  ) : (
    <p className="rating">{body}</p>
  );
}

type Sort = 'latest' | 'high' | 'low';

function ReviewForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { addReview, notify } = useStore();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [fit, setFit] = useState('정사이즈예요');
  const [option, setOption] = useState(`${product.colors[0].name} / ${product.sizes[0]}`);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const id = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!rating) er.rating = '별점을 선택해 주세요.';
    if (title.trim().length < 2) er.title = '제목을 2자 이상 입력해 주세요.';
    if (body.trim().length < 10) er.body = '내용을 10자 이상 입력해 주세요.';
    setErrors(er);
    if (Object.keys(er).length) return;
    addReview(product.id, { rating, title: title.trim(), body: body.trim(), fit, option });
    notify('리뷰가 등록되었습니다. (이 브라우저에만 저장됩니다)');
    onDone();
  }

  return (
    <form className="review-form stack" onSubmit={submit} noValidate>
      <div className="field">
        <span className="label" id={`${id}-rating`}>
          별점
        </span>
        <div className="star-input" role="radiogroup" aria-labelledby={`${id}-rating`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}점`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>
              ★
            </button>
          ))}
        </div>
        {errors.rating && <p className="error-text">{errors.rating}</p>}
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${id}-option`}>구매 옵션</label>
          <select id={`${id}-option`} className="select" value={option} onChange={(e) => setOption(e.target.value)}>
            {product.colors.flatMap((c) => product.sizes.map((s) => <option key={`${c.id}-${s}`}>{`${c.name} / ${s}`}</option>))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-fit`}>사이즈 체감</label>
          <select id={`${id}-fit`} className="select" value={fit} onChange={(e) => setFit(e.target.value)}>
            <option>정사이즈예요</option>
            <option>살짝 커요</option>
            <option>살짝 작아요</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${id}-title`}>제목</label>
        <input id={`${id}-title`} className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} />
        {errors.title && <p className="error-text">{errors.title}</p>}
      </div>
      <div className="field">
        <label htmlFor={`${id}-body`}>내용</label>
        <textarea id={`${id}-body`} className="textarea" value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={!!errors.body} />
        {errors.body && <p className="error-text">{errors.body}</p>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary">
          리뷰 등록
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          취소
        </button>
      </div>
    </form>
  );
}

export function ReviewSection({ product }: { product: Product }) {
  const { reviewsFor, user } = useStore();
  const location = useLocation();
  const [sort, setSort] = useState<Sort>('latest');
  const [writing, setWriting] = useState(false);
  const [visible, setVisible] = useState(5);
  const reviews = reviewsFor(product);
  const { average, count, distribution } = ratingSummary(reviews);
  const sorted = [...reviews].sort((a, b) =>
    sort === 'high' ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt) : sort === 'low' ? a.rating - b.rating || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <section id="reviews" className="section container reviews" aria-labelledby="reviews-title">
      <div className="section-head">
        <h2 id="reviews-title">리뷰 {count}</h2>
        {user ? (
          !writing && (
            <button type="button" className="btn btn-secondary" onClick={() => setWriting(true)}>
              리뷰 쓰기
            </button>
          )
        ) : (
          <Link to="/account/sign-in" state={{ from: location.pathname }} className="btn btn-secondary">
            로그인하고 리뷰 쓰기
          </Link>
        )}
      </div>
      <div className="reviews-layout">
        <div className="review-summary">
          <p className="review-average">{average.toFixed(1)}</p>
          <Stars value={average} size={18} />
          <p className="muted" style={{ fontSize: 13 }}>
            리뷰 {count}개
          </p>
          <ul className="review-bars">
            {distribution.map((d) => (
              <li key={d.star}>
                <span>{d.star}점</span>
                <span className="bar">
                  <span style={{ width: `${count ? (d.count / count) * 100 : 0}%` }} />
                </span>
                <span className="muted">{d.count}</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ fontSize: 12 }}>
            데모용 예시 리뷰가 포함되어 있습니다.
          </p>
        </div>
        <div>
          {writing && <ReviewForm product={product} onDone={() => setWriting(false)} />}
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 13 }}>전체 {count}개</span>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              정렬
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="latest">최신순</option>
                <option value="high">별점 높은순</option>
                <option value="low">별점 낮은순</option>
              </select>
            </label>
          </div>
          <ul>
            {sorted.slice(0, visible).map((r) => (
              <li key={r.id} className="review">
                <div className="review-head">
                  <Stars value={r.rating} />
                  <span className="sr-only">{r.rating}점</span>
                  <strong>{r.title}</strong>
                  {!r.seeded && <span className="status-pill">내 리뷰</span>}
                </div>
                <p>{r.body}</p>
                <p className="muted review-meta">
                  {r.author} · {formatDate(r.createdAt)}
                  {r.option && ` · ${r.option}`}
                  {r.fit && ` · ${r.fit}`}
                  {r.height && ` · ${r.height}cm`}
                </p>
              </li>
            ))}
          </ul>
          {visible < sorted.length && (
            <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setVisible((v) => v + 5)}>
              리뷰 더 보기
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
