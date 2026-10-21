"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/Pagination";
import { Stars } from "@/components/Price";
import { useToast } from "@/components/providers/Toast";
import { StatusBadge } from "@/components/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { useUrlState } from "@/hooks/useUrlState";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

export default function AdminReviewsPage() {
  return (
    <Suspense>
      <AdminReviews />
    </Suspense>
  );
}

function AdminReviews() {
  const url = useUrlState();
  const { notify } = useToast();
  const rating = url.get("rating");
  const status = url.get("status");
  const { data, error, loading, reload } = useAsync(() => adminApi.reviews({ rating, status, page: url.page, size: 30 }), [url.key]);

  return (
    <>
      <div className="admin-head">
        <h1>리뷰</h1>
      </div>
      <div className="filter-bar">
        <select className="select" value={rating} onChange={(e) => url.set({ rating: e.target.value })} aria-label="별점">
          <option value="">전체 별점</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}점
            </option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => url.set({ status: e.target.value })} aria-label="상태">
          <option value="">전체</option>
          <option value="VISIBLE">노출</option>
          <option value="HIDDEN">숨김</option>
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 160 }} />}
      {data && data.items.length === 0 && <p className="empty">리뷰가 없어요.</p>}
      <ul className="review-list">
        {data?.items.map((r) => (
          <li key={r.id} className="stack-sm">
            <div className="row between small">
              <span>
                <Stars value={r.rating} /> <strong>{r.authorName}</strong> ·{" "}
                <Link className="link" href={`/products/${r.productSlug}`} target="_blank">
                  {r.productName}
                </Link>{" "}
                <span className="muted">{r.option}</span>
              </span>
              <span className="row">
                <span className="muted">{formatDate(r.createdAt)}</span>
                <StatusBadge status={r.status} label={r.status === "VISIBLE" ? "노출" : "숨김"} />
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={async () => {
                    try {
                      await adminApi.setReviewStatus(r.id, r.status === "VISIBLE" ? "HIDDEN" : "VISIBLE");
                      notify("바꿨어요.");
                      reload();
                    } catch (e) {
                      notify(errorMessage(e), "error");
                    }
                  }}
                >
                  {r.status === "VISIBLE" ? "숨기기" : "다시 노출"}
                </button>
              </span>
            </div>
            {r.title && <strong>{r.title}</strong>}
            <p className="prose small">{r.body}</p>
          </li>
        ))}
      </ul>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => url.set({ page: p })} />}
    </>
  );
}
