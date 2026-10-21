"use client";

import Link from "next/link";
import { useState } from "react";
import { OrderList } from "@/components/mypage/OrderList";
import { useAuth } from "@/components/providers/Auth";
import { useToast } from "@/components/providers/Toast";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { formatDate, formatPhone } from "@/lib/format";
import { validatePhone } from "@/lib/validation";

export default function MyPageHome() {
  const { me, setMe } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(me?.name ?? "");
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [marketing, setMarketing] = useState(me?.marketingAgreed ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  return (
    <div className="stack" style={{ gap: 40 }}>
      <section>
        <h1 className="page-title">내 정보</h1>
        <form
          className="panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const err = !name.trim() ? "이름을 입력해주세요." : validatePhone(phone);
            if (err) return setError(err);
            setBusy(true);
            setError(null);
            try {
              setMe(await authApi.updateMe({ name: name.trim(), phone: phone.trim(), marketingAgreed: marketing }));
              notify("저장했어요.");
            } catch (ex) {
              setError(errorMessage(ex));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <label className="field">
              <span>이메일</span>
              <input className="input" value={me.email ?? "등록된 이메일 없음"} readOnly />
            </label>
            <div className="field">
              <span className="label">가입일 · 로그인 방식</span>
              <p style={{ padding: "10px 0" }} className="small">
                {formatDate(me.createdAt)} · {[me.hasPassword && "이메일", ...me.socialProviders.map((p) => (p === "KAKAO" ? "카카오" : "네이버"))].filter(Boolean).join(", ")}
              </p>
            </div>
            <label className="field">
              <span>이름</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>휴대폰</span>
              <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            할인·이벤트 소식 받기
          </label>
          {error && <p className="form-error">{error}</p>}
          <div>
            <button className="btn" disabled={busy}>
              저장
            </button>
          </div>
        </form>
      </section>
      <section>
        <div className="section-head">
          <h2>최근 주문</h2>
          <Link className="link small" href="/mypage/orders">
            전체 보기
          </Link>
        </div>
        <OrderList limit={3} />
      </section>
    </div>
  );
}
