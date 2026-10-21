"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Pagination } from "@/components/Pagination";
import { useSettings } from "@/components/providers/Settings";
import { useToast } from "@/components/providers/Toast";
import { StatusBadge } from "@/components/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { useUrlState } from "@/hooks/useUrlState";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminClaim, ClaimStatus } from "@/lib/api/types";
import { CLAIM_REASON_LABEL, CLAIM_STATUS_LABEL, CLAIM_TYPE_LABEL, formatDateTime, formatPrice } from "@/lib/format";

export default function AdminClaimsPage() {
  return (
    <Suspense>
      <AdminClaims />
    </Suspense>
  );
}

function AdminClaims() {
  const url = useUrlState();
  const status = url.get("status");
  const { data, error, loading, reload } = useAsync(() => adminApi.claims({ status, page: url.page, size: 30 }), [url.key]);
  const [target, setTarget] = useState<AdminClaim | null>(null);

  return (
    <>
      <div className="admin-head">
        <h1>교환·반품</h1>
      </div>
      <div className="filter-bar">
        <select className="select" value={status} onChange={(e) => url.set({ status: e.target.value })} aria-label="상태">
          <option value="">전체</option>
          {(Object.keys(CLAIM_STATUS_LABEL) as ClaimStatus[]).map((s) => (
            <option key={s} value={s}>
              {CLAIM_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 160 }} />}
      {data && data.items.length === 0 && <p className="empty">신청이 없어요.</p>}
      {data && data.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>접수일</th>
                <th>주문번호</th>
                <th>고객</th>
                <th>종류</th>
                <th>상품</th>
                <th>사유</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>{formatDateTime(c.createdAt)}</td>
                  <td>
                    <Link className="link" href={`/admin/orders/${c.orderNumber}`}>
                      {c.orderNumber}
                    </Link>
                  </td>
                  <td>{c.customerName}</td>
                  <td>{CLAIM_TYPE_LABEL[c.type]}</td>
                  <td>
                    {c.productName} ({c.option}) × {c.quantity}
                  </td>
                  <td title={c.reasonDetail ?? undefined}>{CLAIM_REASON_LABEL[c.reasonType]}</td>
                  <td>
                    <StatusBadge status={c.status} label={CLAIM_STATUS_LABEL[c.status]} />
                  </td>
                  <td>
                    {c.status !== "COMPLETED" && c.status !== "REJECTED" && (
                      <button type="button" className="link" onClick={() => setTarget(c)}>
                        처리
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => url.set({ page: p })} />}
      <Dialog open={!!target} onClose={() => setTarget(null)} title="교환·반품 처리">
        {target && (
          <ClaimProcess
            claim={target}
            onDone={() => {
              setTarget(null);
              reload();
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function ClaimProcess({ claim, onDone }: { claim: AdminClaim; onDone: () => void }) {
  const { notify } = useToast();
  const { returnShippingFee } = useSettings();
  const customerPays = claim.reasonType === "CHANGE_OF_MIND" || claim.reasonType === "SIZE";
  const [fee, setFee] = useState(claim.returnShippingFee || (customerPays ? returnShippingFee : 0));
  const [refund, setRefund] = useState(claim.refundAmount ?? 0);
  const [busy, setBusy] = useState(false);

  const act = async (status: ClaimStatus) => {
    setBusy(true);
    try {
      await adminApi.updateClaim(claim.id, {
        status,
        returnShippingFee: fee,
        refundAmount: status === "COMPLETED" && claim.type === "RETURN" ? refund : undefined,
      });
      notify(`${CLAIM_STATUS_LABEL[status]} 처리했어요.`);
      onDone();
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <p className="small">
        {CLAIM_TYPE_LABEL[claim.type]} · {claim.productName} ({claim.option}) × {claim.quantity}
        <br />
        사유: {CLAIM_REASON_LABEL[claim.reasonType]}
        {claim.reasonDetail && <> — {claim.reasonDetail}</>}
      </p>
      <label className="field">
        <span>고객 부담 배송비 (원)</span>
        <input className="input" inputMode="numeric" value={fee} onChange={(e) => setFee(Number(e.target.value.replace(/\D/g, "")) || 0)} />
      </label>
      {claim.type === "RETURN" && (
        <label className="field">
          <span>환불 금액 (완료 시 부분 환불, 원)</span>
          <input className="input" inputMode="numeric" value={refund} onChange={(e) => setRefund(Number(e.target.value.replace(/\D/g, "")) || 0)} />
          <span className="small muted">상품 금액에서 고객 부담 배송비 {formatPrice(fee)}을(를) 뺀 금액을 입력해주세요.</span>
        </label>
      )}
      <p className="small muted">
        승인: 회수 진행 → 완료: 상품 확인 후 {claim.type === "RETURN" ? "환불하고 재고를 복구" : "교환 상품을 발송"}해요.
      </p>
      <div className="row">
        {claim.status === "REQUESTED" && (
          <>
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => act("APPROVED")}>
              승인
            </button>
            <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => confirm("거절할까요?") && act("REJECTED")}>
              거절
            </button>
          </>
        )}
        <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => confirm("완료 처리할까요? 반품이면 환불이 진행돼요.") && act("COMPLETED")}>
          완료
        </button>
      </div>
    </div>
  );
}
