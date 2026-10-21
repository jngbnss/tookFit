"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Pagination } from "@/components/Pagination";
import { Stars } from "@/components/Price";
import { useToast } from "@/components/providers/Toast";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/lib/api/client";
import { reviewApi, type MyReview } from "@/lib/api/catalog";
import type { FitFeedback, ReviewableItem } from "@/lib/api/types";
import { FIT_LABEL, formatDate } from "@/lib/format";

type Target = { kind: "new"; item: ReviewableItem } | { kind: "edit"; review: MyReview };

export default function MyReviewsPage() {
  return (
    <Suspense>
      <MyReviews />
    </Suspense>
  );
}

function MyReviews() {
  const params = useSearchParams();
  const { notify } = useToast();
  const [page, setPage] = useState(0);
  const reviewable = useAsync(() => reviewApi.reviewable(), []);
  const mine = useAsync(() => reviewApi.mine(page), [page]);
  const [target, setTarget] = useState<Target | null>(null);
  const [autoOpened, setAutoOpened] = useState(false);

  // 주문 상세의 "리뷰 쓰기"로 들어오면 해당 상품 작성창을 바로 연다
  const writeId = Number(params.get("write"));
  if (!autoOpened && writeId && reviewable.data) {
    const item = reviewable.data.find((i) => i.orderItemId === writeId);
    setAutoOpened(true);
    if (item) setTarget({ kind: "new", item });
  }

  const refresh = async () => {
    setTarget(null);
    await Promise.all([reviewable.reload(), mine.reload()]);
  };

  return (
    <div className="stack" style={{ gap: 40 }}>
      <section>
        <h1 className="page-title">리뷰</h1>
        <h2 className="panel-title">작성할 수 있는 리뷰</h2>
        {reviewable.error && <p className="form-error">{reviewable.error}</p>}
        {reviewable.data?.length === 0 && <p className="empty">배송 완료된 상품의 리뷰를 여기서 쓸 수 있어요.</p>}
        <ul>
          {reviewable.data?.map((i) => (
            <li key={i.orderItemId} className="line-item">
              {i.imageUrl ? <img src={i.imageUrl} alt="" /> : <div className="ph" />}
              <div className="stack-sm" style={{ gap: 4 }}>
                <Link href={`/products/${i.productSlug}`} className="name">
                  {i.productName}
                </Link>
                <span className="opt">
                  {i.option} · {formatDate(i.deliveredAt)} 배송 완료
                </span>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setTarget({ kind: "new", item: i })}>
                리뷰 쓰기
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="panel-title">내가 쓴 리뷰</h2>
        {mine.error && <p className="form-error">{mine.error}</p>}
        {mine.data?.items.length === 0 && <p className="empty">아직 쓴 리뷰가 없어요.</p>}
        <ul className="review-list">
          {mine.data?.items.map((r) => (
            <li key={r.id}>
              <div className="row between small">
                <span>
                  <Stars value={r.rating} />{" "}
                  {r.productSlug ? (
                    <Link className="link" href={`/products/${r.productSlug}`}>
                      {r.productName}
                    </Link>
                  ) : (
                    r.productName
                  )}{" "}
                  <span className="muted">{r.option}</span>
                </span>
                <span className="muted">{formatDate(r.createdAt)}</span>
              </div>
              {r.title && <p style={{ fontWeight: 600, marginTop: 6 }}>{r.title}</p>}
              <p className="prose">{r.body}</p>
              <div className="row small" style={{ marginTop: 6 }}>
                <button type="button" className="link" onClick={() => setTarget({ kind: "edit", review: r })}>
                  수정
                </button>
                <button
                  type="button"
                  className="link accent"
                  onClick={async () => {
                    if (!confirm("리뷰를 삭제할까요?")) return;
                    try {
                      await reviewApi.remove(r.id);
                      notify("삭제했어요.");
                      await refresh();
                    } catch (e) {
                      notify(errorMessage(e), "error");
                    }
                  }}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
        {mine.data && <Pagination page={mine.data.page} totalPages={mine.data.totalPages} onChange={setPage} />}
      </section>

      <Dialog open={!!target} onClose={() => setTarget(null)} title={target?.kind === "edit" ? "리뷰 수정" : "리뷰 쓰기"}>
        {target && <ReviewEditor target={target} onDone={refresh} />}
      </Dialog>
    </div>
  );
}

function ReviewEditor({ target, onDone }: { target: Target; onDone: () => void }) {
  const { notify } = useToast();
  const init = target.kind === "edit" ? target.review : null;
  const [rating, setRating] = useState(init?.rating ?? 5);
  const [title, setTitle] = useState(init?.title ?? "");
  const [body, setBody] = useState(init?.body ?? "");
  const [height, setHeight] = useState(init?.heightCm ? String(init.heightCm) : "");
  const [fit, setFit] = useState<FitFeedback | "">(init?.fitFeedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (body.trim().length < 10) return setError("내용을 10자 이상 써주세요.");
        setBusy(true);
        setError(null);
        const payload = {
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          heightCm: height ? Number(height) : undefined,
          fitFeedback: fit || undefined,
        };
        try {
          if (target.kind === "edit") await reviewApi.update(target.review.id, payload);
          else await reviewApi.create({ ...payload, orderItemId: target.item.orderItemId });
          notify("리뷰를 저장했어요.");
          onDone();
        } catch (ex) {
          setError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      {target.kind === "new" && (
        <p className="small muted">
          {target.item.productName} · {target.item.option}
        </p>
      )}
      <div className="field">
        <span className="label">별점</span>
        <div className="row" role="radiogroup" aria-label="별점">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}점`}
              style={{ fontSize: 26, lineHeight: 1 }}
              onClick={() => setRating(n)}
            >
              {n <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>제목 (선택)</span>
        <input className="input" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>내용</span>
        <textarea className="textarea" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="form-grid">
        <label className="field">
          <span>키 (cm, 선택)</span>
          <input className="input" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))} />
        </label>
        <label className="field">
          <span>사이즈 느낌 (선택)</span>
          <select className="select" value={fit} onChange={(e) => setFit(e.target.value as FitFeedback | "")}>
            <option value="">선택 안 함</option>
            {(Object.keys(FIT_LABEL) as FitFeedback[]).map((f) => (
              <option key={f} value={f}>
                {FIT_LABEL[f]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn" disabled={busy}>
        저장
      </button>
    </form>
  );
}
