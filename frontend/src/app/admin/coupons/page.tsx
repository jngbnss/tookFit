"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { useToast } from "@/components/providers/Toast";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { Coupon, CouponRequest } from "@/lib/api/types";
import { isoToLocalInput, localInputToIso } from "@/lib/datetime-local";
import { asItems, formatDate, formatPrice } from "@/lib/format";

const EMPTY: CouponRequest = {
  code: "",
  name: "",
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: null,
  minOrderAmount: 0,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  perUserLimit: 1,
  active: true,
};

export default function AdminCouponsPage() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.coupons({ size: 100 }), []);
  const [editing, setEditing] = useState<(CouponRequest & { id?: number }) | null>(null);
  const coupons = asItems<Coupon>(data);

  return (
    <>
      <div className="admin-head">
        <h1>쿠폰</h1>
        <button type="button" className="btn btn-sm" onClick={() => setEditing(EMPTY)}>
          쿠폰 만들기
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 160 }} />}
      {data && coupons.length === 0 && <p className="empty">쿠폰이 없어요.</p>}
      {coupons.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>코드</th>
                <th>이름</th>
                <th>할인</th>
                <th className="num">최소 주문</th>
                <th>기간</th>
                <th className="num">사용</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.code}</strong>
                  </td>
                  <td>{c.name}</td>
                  <td>
                    {c.discountType === "PERCENT" ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                    {c.maxDiscount ? <span className="muted"> (최대 {formatPrice(c.maxDiscount)})</span> : null}
                  </td>
                  <td className="num">{formatPrice(c.minOrderAmount)}</td>
                  <td>
                    {c.startsAt || c.endsAt ? `${formatDate(c.startsAt)} ~ ${formatDate(c.endsAt)}` : "상시"}
                  </td>
                  <td className="num">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td>{c.active ? "사용 중" : <span className="muted">중지</span>}</td>
                  <td>
                    <div className="row">
                      <button type="button" className="link" onClick={() => setEditing({ ...c })}>
                        수정
                      </button>
                      <button
                        type="button"
                        className="link"
                        onClick={async () => {
                          try {
                            await adminApi.updateCoupon(c.id, { active: !c.active });
                            notify(c.active ? "중지했어요." : "다시 켰어요.");
                            reload();
                          } catch (e) {
                            notify(errorMessage(e), "error");
                          }
                        }}
                      >
                        {c.active ? "중지" : "사용"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "쿠폰 수정" : "쿠폰 만들기"}>
        {editing && (
          <CouponForm
            initial={editing}
            onSaved={() => {
              setEditing(null);
              notify("저장했어요.");
              reload();
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function CouponForm({ initial, onSaved }: { initial: CouponRequest & { id?: number }; onSaved: () => void }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;
  const set = <K extends keyof CouponRequest>(k: K, v: CouponRequest[K]) => setF((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[A-Z0-9_-]{3,30}$/.test(f.code)) return setError("코드는 영문 대문자, 숫자 3~30자로 입력해주세요.");
        if (!f.name.trim()) return setError("쿠폰 이름을 입력해주세요.");
        if (f.discountType === "PERCENT" && (f.discountValue < 1 || f.discountValue > 90)) return setError("할인율은 1~90% 사이로 입력해주세요.");
        if (f.discountValue < 1) return setError("할인 값을 입력해주세요.");
        setBusy(true);
        setError(null);
        const { id, ...body } = f;
        try {
          if (id) await adminApi.updateCoupon(id, { ...body, name: body.name.trim() });
          else await adminApi.createCoupon({ ...body, name: body.name.trim() });
          onSaved();
        } catch (ex) {
          setError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <label className="field">
          <span>코드</span>
          <input className="input" value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} disabled={!!initial.id} placeholder="WELCOME10" />
        </label>
        <label className="field">
          <span>이름</span>
          <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="신규 가입 10% 할인" />
        </label>
        <label className="field">
          <span>할인 방식</span>
          <select className="select" value={f.discountType} onChange={(e) => set("discountType", e.target.value as CouponRequest["discountType"])}>
            <option value="PERCENT">비율 (%)</option>
            <option value="FIXED">금액 (원)</option>
          </select>
        </label>
        <label className="field">
          <span>할인 값</span>
          <input className="input" inputMode="numeric" value={f.discountValue} onChange={(e) => set("discountValue", num(e.target.value))} />
        </label>
        {f.discountType === "PERCENT" && (
          <label className="field">
            <span>최대 할인 금액 (선택)</span>
            <input className="input" inputMode="numeric" value={f.maxDiscount ?? ""} onChange={(e) => set("maxDiscount", num(e.target.value) || null)} />
          </label>
        )}
        <label className="field">
          <span>최소 주문 금액</span>
          <input className="input" inputMode="numeric" value={f.minOrderAmount} onChange={(e) => set("minOrderAmount", num(e.target.value))} />
        </label>
        <label className="field">
          <span>시작 (선택)</span>
          <input className="input" type="datetime-local" value={isoToLocalInput(f.startsAt)} onChange={(e) => set("startsAt", localInputToIso(e.target.value))} />
        </label>
        <label className="field">
          <span>종료 (선택)</span>
          <input className="input" type="datetime-local" value={isoToLocalInput(f.endsAt)} onChange={(e) => set("endsAt", localInputToIso(e.target.value))} />
        </label>
        <label className="field">
          <span>전체 사용 한도 (비우면 무제한)</span>
          <input className="input" inputMode="numeric" value={f.usageLimit ?? ""} onChange={(e) => set("usageLimit", num(e.target.value) || null)} />
        </label>
        <label className="field">
          <span>1인당 사용 횟수</span>
          <input className="input" inputMode="numeric" value={f.perUserLimit} onChange={(e) => set("perUserLimit", Math.max(1, num(e.target.value)))} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />
        사용 중
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn" disabled={busy}>
        저장
      </button>
    </form>
  );
}
