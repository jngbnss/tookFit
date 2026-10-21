"use client";

import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { catalogApi } from "@/lib/api/catalog";
import { FIT_LABEL, formatDate } from "@/lib/format";
import { Pagination } from "../Pagination";
import { Stars } from "../Price";

export function ProductReviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<"newest" | "rating">("newest");
  const { data, loading, error } = useAsync(() => catalogApi.reviews(slug, page, sort), [slug, page, sort]);

  const summary = data?.summary;
  return (
    <div>
      <div className="section-head">
        <h2>리뷰 {summary ? `(${summary.count})` : ""}</h2>
        <select className="select" style={{ width: "auto", minHeight: 36 }} value={sort} onChange={(e) => {
            setSort(e.target.value as "newest" | "rating");
            setPage(0);
          }} aria-label="리뷰 정렬">
          <option value="newest">최신순</option>
          <option value="rating">별점순</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 120 }} />}

      {summary && summary.count > 0 && (
        <div className="review-summary">
          <div>
            <p className="avg">{summary.average.toFixed(1)}</p>
            <Stars value={summary.average} />
          </div>
          <ul className="stack-sm">
            {(["5", "4", "3", "2", "1"] as const).map((k) => {
              const n = summary.distribution[k] ?? 0;
              return (
                <li key={k} className="row small" style={{ flexWrap: "nowrap" }}>
                  <span style={{ width: 24 }}>{k}점</span>
                  <span className="bar">
                    <span style={{ width: `${summary.count ? (n / summary.count) * 100 : 0}%` }} />
                  </span>
                  <span className="muted" style={{ width: 32, textAlign: "right" }}>
                    {n}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {data && data.page.items.length === 0 && <p className="empty">아직 리뷰가 없어요. 구매 후 첫 리뷰를 남겨주세요.</p>}

      <ul className="review-list">
        {data?.page.items.map((r) => (
          <li key={r.id}>
            <div className="row between small">
              <span>
                <Stars value={r.rating} /> <strong>{r.authorName}</strong>
                {r.mine && <span className="muted"> (내 리뷰)</span>}
              </span>
              <span className="muted">{formatDate(r.createdAt)}</span>
            </div>
            <p className="small muted" style={{ marginTop: 4 }}>
              {r.option}
              {r.heightCm ? ` · 키 ${r.heightCm}cm` : ""}
              {r.fitFeedback ? ` · ${FIT_LABEL[r.fitFeedback]}` : ""}
            </p>
            {r.title && <p style={{ fontWeight: 600, marginTop: 8 }}>{r.title}</p>}
            <p className="prose" style={{ marginTop: 4 }}>
              {r.body}
            </p>
          </li>
        ))}
      </ul>
      {data && <Pagination page={data.page.page} totalPages={data.page.totalPages} onChange={setPage} />}
    </div>
  );
}
