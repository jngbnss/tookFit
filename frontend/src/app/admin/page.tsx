"use client";

import Link from "next/link";
import { AdminOrderTable } from "@/components/admin/AdminOrderTable";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import type { OrderStatus } from "@/lib/api/types";
import { formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";

export default function AdminDashboardPage() {
  const { data, error, loading } = useAsync(() => adminApi.dashboard(), []);

  return (
    <>
      <div className="admin-head">
        <h1>대시보드</h1>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 120 }} />}
      {data && (
        <div className="stack" style={{ gap: 28 }}>
          <div className="stat-grid">
            <Stat label="오늘 매출" value={formatPrice(data.today.sales)} sub={`${data.today.orders}건`} />
            <Stat label="이번 주 매출" value={formatPrice(data.week.sales)} sub={`${data.week.orders}건`} />
            <Stat label="처리할 주문 (결제 완료)" value={`${data.statusCounts.PAID ?? 0}건`} href="/admin/orders?status=PAID" />
            <Stat label="배송 준비중" value={`${data.statusCounts.PREPARING ?? 0}건`} href="/admin/orders?status=PREPARING" />
            <Stat label="교환·반품 대기" value={`${data.pendingClaims}건`} href="/admin/claims?status=REQUESTED" />
          </div>

          <section>
            <h2 className="panel-title">주문 상태</h2>
            <div className="chips">
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                <Link key={s} className="chip" href={`/admin/orders?status=${s}`}>
                  {ORDER_STATUS_LABEL[s]} {data.statusCounts[s] ?? 0}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="panel-title">재고 부족 (3개 이하)</h2>
            {data.lowStock.length === 0 ? (
              <p className="muted small">재고가 부족한 옵션이 없어요.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>상품</th>
                      <th>옵션</th>
                      <th className="num">재고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStock.map((v) => (
                      <tr key={v.variantId}>
                        <td>
                          <Link className="link" href={`/admin/products/${v.productId}`}>
                            {v.productName}
                          </Link>
                        </td>
                        <td>{v.option}</td>
                        <td className={`num ${v.stock === 0 ? "accent" : ""}`}>{v.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <div className="section-head">
              <h2 className="panel-title" style={{ marginBottom: 0 }}>
                최근 주문
              </h2>
              <Link className="link small" href="/admin/orders">
                전체 보기
              </Link>
            </div>
            <AdminOrderTable orders={data.recentOrders} />
          </section>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="label">{label}</p>
      <p className="value">{value}</p>
      {sub && <p className="small muted">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="stat">
      {body}
    </Link>
  ) : (
    <div className="stat">{body}</div>
  );
}
