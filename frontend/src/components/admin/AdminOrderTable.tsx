import Link from "next/link";
import type { AdminOrderSummary } from "@/lib/api/types";
import { formatDateTime, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import { StatusBadge } from "../StatusBadge";

export function AdminOrderTable({ orders }: { orders: AdminOrderSummary[] }) {
  if (!orders.length) return <p className="empty">주문이 없어요.</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>주문번호</th>
            <th>주문일시</th>
            <th>상품</th>
            <th>주문자</th>
            <th>받는 분</th>
            <th className="num">금액</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderNumber}>
              <td>
                <Link className="link" href={`/admin/orders/${o.orderNumber}`}>
                  {o.orderNumber}
                </Link>
              </td>
              <td>{formatDateTime(o.createdAt)}</td>
              <td style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>{o.orderName}</td>
              <td>
                {o.ordererName}
                {o.ordererPhone && <span className="muted"> {o.ordererPhone}</span>}
              </td>
              <td>{o.recipient}</td>
              <td className="num">{formatPrice(o.total)}</td>
              <td>
                <StatusBadge status={o.status} label={ORDER_STATUS_LABEL[o.status]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
