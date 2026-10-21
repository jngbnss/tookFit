"use client";

import Link from "next/link";
import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { myOrderApi } from "@/lib/api/me";
import { formatDate, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import { Pagination } from "../Pagination";
import { StatusBadge } from "../StatusBadge";

export function OrderList({ limit }: { limit?: number }) {
  const [page, setPage] = useState(0);
  const { data, loading, error } = useAsync(() => myOrderApi.list(page), [page]);

  if (error) return <p className="form-error">{error}</p>;
  if (loading && !data) return <div className="skeleton" style={{ height: 120 }} />;
  if (!data || data.items.length === 0) return <p className="empty">아직 주문 내역이 없어요.</p>;

  const items = limit ? data.items.slice(0, limit) : data.items;
  return (
    <>
      <ul>
        {items.map((o) => (
          <li key={o.orderNumber} className="line-item">
            {o.thumbnailUrl ? <img src={o.thumbnailUrl} alt="" /> : <div className="ph" />}
            <div className="stack-sm" style={{ gap: 4 }}>
              <span className="small muted">
                {formatDate(o.createdAt)} · {o.orderNumber}
              </span>
              <Link className="name" href={`/mypage/orders/${o.orderNumber}`}>
                {o.orderName}
              </Link>
              <span className="small">{formatPrice(o.total)}</span>
            </div>
            <div className="stack-sm" style={{ alignItems: "flex-end" }}>
              <StatusBadge status={o.status} label={ORDER_STATUS_LABEL[o.status]} />
              <Link className="link small" href={`/mypage/orders/${o.orderNumber}`}>
                상세
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {!limit && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}
