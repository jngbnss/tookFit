"use client";

import { Suspense, useState } from "react";
import { Pagination } from "@/components/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { useUrlState } from "@/hooks/useUrlState";
import { adminApi } from "@/lib/api/admin";
import { formatDate, formatPrice } from "@/lib/format";

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsers />
    </Suspense>
  );
}

function AdminUsers() {
  const url = useUrlState();
  const q = url.get("q");
  const role = url.get("role");
  const [qInput, setQInput] = useState(q);
  const { data, error, loading } = useAsync(() => adminApi.users({ q, role, page: url.page, size: 30 }), [url.key]);

  return (
    <>
      <div className="admin-head">
        <h1>회원</h1>
      </div>
      <div className="filter-bar">
        <select className="select" value={role} onChange={(e) => url.set({ role: e.target.value })} aria-label="역할">
          <option value="">전체</option>
          <option value="USER">일반</option>
          <option value="ADMIN">관리자</option>
        </select>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            url.set({ q: qInput.trim() });
          }}
        >
          <input className="input" placeholder="이름, 이메일, 연락처" value={qInput} onChange={(e) => setQInput(e.target.value)} />
          <button className="btn btn-sm">검색</button>
        </form>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 160 }} />}
      {data && data.items.length === 0 && <p className="empty">회원이 없어요.</p>}
      {data && data.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>이름</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>가입 방식</th>
                <th className="num">주문</th>
                <th className="num">누적 결제</th>
                <th>가입일</th>
                <th>최근 로그인</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    {u.name}
                    {u.role === "ADMIN" && <span className="small accent"> 관리자</span>}
                  </td>
                  <td>{u.email ?? "-"}</td>
                  <td>{u.phone ?? "-"}</td>
                  <td>{u.socialProviders.length ? u.socialProviders.join(", ") : "이메일"}</td>
                  <td className="num">{u.orderCount}</td>
                  <td className="num">{formatPrice(u.totalSpent)}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{formatDate(u.lastLoginAt)}</td>
                  <td>{u.status === "ACTIVE" ? "정상" : <span className="muted">탈퇴</span>}</td>
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
