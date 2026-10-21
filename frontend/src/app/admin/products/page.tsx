"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { useUrlState } from "@/hooks/useUrlState";
import { adminApi } from "@/lib/api/admin";
import type { ProductStatus } from "@/lib/api/types";
import { formatDate, formatPrice, PRODUCT_STATUS_LABEL } from "@/lib/format";

export default function AdminProductsPage() {
  return (
    <Suspense>
      <AdminProducts />
    </Suspense>
  );
}

function AdminProducts() {
  const url = useUrlState();
  const status = url.get("status");
  const category = url.get("category");
  const q = url.get("q");
  const [qInput, setQInput] = useState(q);
  const categories = useAsync(() => adminApi.categories(), []);
  const { data, error, loading } = useAsync(() => adminApi.products({ status, category, q, page: url.page, size: 30 }), [url.key]);

  return (
    <>
      <div className="admin-head">
        <h1>상품</h1>
        <Link className="btn btn-sm" href="/admin/products/new">
          상품 등록
        </Link>
      </div>
      <div className="filter-bar">
        <select className="select" value={status} onChange={(e) => url.set({ status: e.target.value })} aria-label="상태">
          <option value="">전체 상태</option>
          {(Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map((s) => (
            <option key={s} value={s}>
              {PRODUCT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select className="select" value={category} onChange={(e) => url.set({ category: e.target.value })} aria-label="카테고리">
          <option value="">전체 카테고리</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            url.set({ q: qInput.trim() });
          }}
        >
          <input className="input" placeholder="상품명" value={qInput} onChange={(e) => setQInput(e.target.value)} />
          <button className="btn btn-sm">검색</button>
        </form>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 200 }} />}
      {data && data.items.length === 0 && <p className="empty">상품이 없어요.</p>}
      {data && data.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>상품명</th>
                <th>카테고리</th>
                <th className="num">판매가</th>
                <th className="num">재고 합계</th>
                <th className="num">옵션</th>
                <th>상태</th>
                <th>수정일</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td>{p.thumbnailUrl ? <img className="thumb-sm" src={p.thumbnailUrl} alt="" /> : <div className="thumb-sm" />}</td>
                  <td>
                    <Link className="link" href={`/admin/products/${p.id}`}>
                      {p.name}
                    </Link>
                    {p.badge && <span className="small muted"> {p.badge}</span>}
                  </td>
                  <td>{p.categoryName}</td>
                  <td className="num">
                    {formatPrice(p.price)}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <>
                        <br />
                        <del className="muted">{formatPrice(p.originalPrice)}</del>
                      </>
                    )}
                  </td>
                  <td className={`num ${p.totalStock === 0 ? "accent" : ""}`}>{p.totalStock}</td>
                  <td className="num">{p.variantCount}</td>
                  <td>
                    <StatusBadge status={p.status} label={PRODUCT_STATUS_LABEL[p.status]} />
                  </td>
                  <td>{formatDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => url.set({ page: p })} />}
    </>
  );
}
