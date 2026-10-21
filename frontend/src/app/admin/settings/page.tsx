"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/Toast";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminSettings, BusinessInfo } from "@/lib/api/types";

export default function AdminSettingsPage() {
  const { data, error, loading } = useAsync(() => adminApi.settings(), []);
  return (
    <>
      <div className="admin-head">
        <h1>설정</h1>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 240 }} />}
      {data && <SettingsForm initial={data} />}
    </>
  );
}

function SettingsForm({ initial }: { initial: AdminSettings }) {
  const { notify } = useToast();
  const [f, setF] = useState<AdminSettings>({ ...initial, business: { ...initial.business } });
  const [busy, setBusy] = useState(false);
  const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;
  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => setF((x) => ({ ...x, [k]: v }));
  const setBiz = (k: keyof BusinessInfo, v: string) => setF((x) => ({ ...x, business: { ...x.business, [k]: v || null } }));

  return (
    <form
      className="stack"
      style={{ gap: 24 }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          setF(await adminApi.saveSettings(f));
          notify("저장했어요. 쇼핑몰 화면에 바로 반영돼요.");
        } catch (ex) {
          notify(errorMessage(ex), "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="panel stack">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          기본
        </h2>
        <div className="form-grid">
          <label className="field">
            <span>쇼핑몰 이름</span>
            <input className="input" value={f.storeName} onChange={(e) => set("storeName", e.target.value)} />
          </label>
          <label className="field">
            <span>옵션당 최대 구매 수량</span>
            <input className="input" inputMode="numeric" value={f.maxQuantityPerItem} onChange={(e) => set("maxQuantityPerItem", Math.max(1, num(e.target.value)))} />
          </label>
        </div>
      </section>

      <section className="panel stack">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          배송비
        </h2>
        <div className="form-grid">
          <label className="field">
            <span>기본 배송비 (원)</span>
            <input className="input" inputMode="numeric" value={f.shippingFee} onChange={(e) => set("shippingFee", num(e.target.value))} />
          </label>
          <label className="field">
            <span>무료배송 기준 금액 (원)</span>
            <input className="input" inputMode="numeric" value={f.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", num(e.target.value))} />
          </label>
          <label className="field">
            <span>반품 왕복 배송비 (원)</span>
            <input className="input" inputMode="numeric" value={f.returnShippingFee} onChange={(e) => set("returnShippingFee", num(e.target.value))} />
          </label>
        </div>
      </section>

      <section className="panel stack">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          고객센터
        </h2>
        <div className="form-grid">
          <label className="field">
            <span>전화</span>
            <input className="input" value={f.csPhone ?? ""} onChange={(e) => set("csPhone", e.target.value || null)} placeholder="02-000-0000" />
          </label>
          <label className="field">
            <span>이메일</span>
            <input className="input" type="email" value={f.csEmail ?? ""} onChange={(e) => set("csEmail", e.target.value || null)} />
          </label>
          <label className="field span-2">
            <span>운영 시간</span>
            <input className="input" value={f.csHours ?? ""} onChange={(e) => set("csHours", e.target.value || null)} placeholder="평일 10:00~17:00 (점심 12:30~13:30)" />
          </label>
        </div>
      </section>

      <section className="panel stack">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          사업자 정보
        </h2>
        <p className="small muted">사업자등록과 통신판매업 신고를 마치면 입력해주세요. 비어 있으면 화면 하단에 &lsquo;사업자 정보 준비 중&rsquo;으로 보여요. 전자상거래법상 실제 판매 전에 반드시 표시해야 해요.</p>
        <div className="form-grid">
          <label className="field">
            <span>상호</span>
            <input className="input" value={f.business.companyName ?? ""} onChange={(e) => setBiz("companyName", e.target.value)} />
          </label>
          <label className="field">
            <span>대표자</span>
            <input className="input" value={f.business.ceoName ?? ""} onChange={(e) => setBiz("ceoName", e.target.value)} />
          </label>
          <label className="field">
            <span>사업자등록번호</span>
            <input className="input" value={f.business.registrationNumber ?? ""} onChange={(e) => setBiz("registrationNumber", e.target.value)} placeholder="000-00-00000" />
          </label>
          <label className="field">
            <span>통신판매업 신고번호</span>
            <input className="input" value={f.business.mailOrderNumber ?? ""} onChange={(e) => setBiz("mailOrderNumber", e.target.value)} placeholder="제2026-서울○○-0000호" />
          </label>
          <label className="field span-2">
            <span>사업장 주소</span>
            <input className="input" value={f.business.address ?? ""} onChange={(e) => setBiz("address", e.target.value)} />
          </label>
          <label className="field">
            <span>개인정보보호책임자</span>
            <input className="input" value={f.business.privacyOfficer ?? ""} onChange={(e) => setBiz("privacyOfficer", e.target.value)} />
          </label>
        </div>
      </section>

      <div>
        <button className="btn" disabled={busy}>
          {busy ? "저장 중…" : "설정 저장"}
        </button>
      </div>
    </form>
  );
}
