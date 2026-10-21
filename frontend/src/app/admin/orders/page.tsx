"use client";

import { Suspense, useState } from "react";
import { AdminOrderTable } from "@/components/admin/AdminOrderTable";
import { Pagination } from "@/components/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { useUrlState } from "@/hooks/useUrlState";
import { adminApi, orderExportUrl } from "@/lib/api/admin";
import type { OrderStatus } from "@/lib/api/types";
import { ORDER_STATUS_LABEL } from "@/lib/format";

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrders />
    </Suspense>
  );
}

function AdminOrders() {
  const url = useUrlState();
  const status = url.get("status");
  const from = url.get("from");
  const to = url.get("to");
  const q = url.get("q");
  const [qInput, setQInput] = useState(q);

  const { data, error, loading } = useAsync(
    () => adminApi.orders({ status, from, to, q, page: url.page, size: 30, sort: "createdAt,desc" }),
    [url.key],
  );

  return (
    <>
      <div className="admin-head">
        <h1>주문</h1>
        <a className="btn btn-sm btn-ghost" href={orderExportUrl({ from, to, status })} download>
          CSV 내보내기 (송장용)
        </a>
      </div>
      <div className="filter-bar">
        <select className="select" value={status} onChange={(e) => url.set({ status: e.target.value })} aria-label="상태">
          <option value="">전체 상태</option>
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input className="input" type="date" value={from} onChange={(e) => url.set({ from: e.target.value })} aria-label="시작일" />
        <input className="input" type="date" value={to} onChange={(e) => url.set({ to: e.target.value })} aria-label="종료일" />
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            url.set({ q: qInput.trim() });
          }}
        >
          <input className="input" placeholder="주문번호, 이름, 연락처" value={qInput} onChange={(e) => setQInput(e.target.value)} />
          <button className="btn btn-sm">검색</button>
        </form>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data ? <div className="skeleton" style={{ height: 200 }} /> : data && <AdminOrderTable orders={data.items} />}
      {data && (
        <>
          <p className="small muted" style={{ marginTop: 8 }}>
            총 {data.totalElements.toLocaleString()}건
          </p>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => url.set({ page: p })} />
        </>
      )}
    </>
  );
}
