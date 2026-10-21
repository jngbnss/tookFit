"use client";

import { useState } from "react";
import { openPostcode } from "@/lib/external-scripts";
import { formatPhone } from "@/lib/format";

export type AddressValue = {
  recipient: string;
  phone: string;
  postalCode: string;
  address1: string;
  address2: string;
};

export const EMPTY_ADDRESS: AddressValue = { recipient: "", phone: "", postalCode: "", address1: "", address2: "" };

export function validateAddress(v: AddressValue): Partial<Record<keyof AddressValue, string>> {
  const e: Partial<Record<keyof AddressValue, string>> = {};
  if (!v.recipient.trim()) e.recipient = "받는 분 이름을 입력해주세요.";
  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(v.phone.trim())) e.phone = "휴대폰 번호를 정확히 입력해주세요.";
  if (!v.postalCode || !v.address1) e.address1 = "주소 검색으로 주소를 입력해주세요.";
  return e;
}

export function AddressFields({
  value,
  onChange,
  errors = {},
}: {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  errors?: Partial<Record<keyof AddressValue, string>>;
}) {
  const [searchError, setSearchError] = useState<string | null>(null);
  const set = (k: keyof AddressValue, v: string) => onChange({ ...value, [k]: v });

  const search = async () => {
    setSearchError(null);
    try {
      const r = await openPostcode();
      if (r) onChange({ ...value, postalCode: r.postalCode, address1: r.address1 });
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "주소 검색을 열지 못했어요.");
    }
  };

  return (
    <div className="form-grid">
      <label className="field">
        <span>받는 분</span>
        <input className="input" value={value.recipient} onChange={(e) => set("recipient", e.target.value)} aria-invalid={!!errors.recipient} autoComplete="name" />
        {errors.recipient && <span className="field-error">{errors.recipient}</span>}
      </label>
      <label className="field">
        <span>휴대폰</span>
        <input
          className="input"
          inputMode="tel"
          value={value.phone}
          onChange={(e) => set("phone", formatPhone(e.target.value))}
          aria-invalid={!!errors.phone}
          autoComplete="tel"
          placeholder="010-0000-0000"
        />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </label>
      <div className="field span-2">
        <span className="label">주소</span>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input className="input" value={value.postalCode} readOnly placeholder="우편번호" aria-label="우편번호" style={{ maxWidth: 140 }} />
          <button type="button" className="btn btn-ghost" style={{ height: 44 }} onClick={search}>
            주소 검색
          </button>
        </div>
        <input
          className="input"
          value={value.address1}
          readOnly
          placeholder="주소 검색 버튼을 눌러주세요"
          aria-label="기본 주소"
          aria-invalid={!!errors.address1}
          onClick={() => !value.address1 && search()}
        />
        <input className="input" value={value.address2} onChange={(e) => set("address2", e.target.value)} placeholder="상세 주소 (동, 호수)" aria-label="상세 주소" autoComplete="address-line2" />
        {(errors.address1 || searchError) && <span className="field-error">{errors.address1 ?? searchError}</span>}
      </div>
    </div>
  );
}
