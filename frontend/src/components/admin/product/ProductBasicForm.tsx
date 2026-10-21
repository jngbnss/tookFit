"use client";

import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import { errorMessage, isApiError } from "@/lib/api/client";
import type { AdminProductRequest, Badge, ProductStatus } from "@/lib/api/types";
import { PRODUCT_STATUS_LABEL } from "@/lib/format";

const EMPTY: AdminProductRequest = {
  slug: "",
  name: "",
  categoryId: 0,
  description: "",
  price: 0,
  originalPrice: null,
  badge: null,
  material: "",
  fit: "",
  care: [],
  status: "DRAFT",
  featuredRank: null,
};

/** 상품명으로 URL용 slug 후보를 만든다. 한글만 있으면 비워 두고 직접 입력하게 한다. */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductBasicForm({
  initial,
  submitLabel = "저장",
  onSubmit,
}: {
  initial?: AdminProductRequest;
  submitLabel?: string;
  onSubmit: (body: AdminProductRequest) => Promise<void>;
}) {
  const categories = useAsync(() => adminApi.categories(), []);
  const [form, setForm] = useState<AdminProductRequest>(initial ?? EMPTY);
  const [careText, setCareText] = useState((initial?.care ?? []).join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof AdminProductRequest>(k: K, v: AdminProductRequest[K]) => setForm((f) => ({ ...f, [k]: v }));
  const categoryId = form.categoryId || categories.data?.[0]?.id || 0;

  return (
    <form
      className="panel stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "상품명을 입력해주세요.";
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) errs.slug = "영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.";
        if (!categoryId) errs.categoryId = "카테고리를 먼저 만들어주세요.";
        if (!(form.price > 0)) errs.price = "판매가를 입력해주세요.";
        if (form.originalPrice != null && form.originalPrice > 0 && form.originalPrice <= form.price) errs.originalPrice = "정가는 판매가보다 커야 해요.";
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setBusy(true);
        setFormError(null);
        try {
          await onSubmit({
            ...form,
            categoryId,
            name: form.name.trim(),
            originalPrice: form.originalPrice || null,
            care: careText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          });
        } catch (ex) {
          if (isApiError(ex) && ex.fields) setErrors(ex.fields);
          setFormError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <label className="field">
          <span>상품명</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: !initial && (!f.slug || f.slug === slugify(f.name)) ? slugify(name) : f.slug }));
            }}
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="field">
          <span>URL 이름 (slug)</span>
          <input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="wool-overcoat" aria-invalid={!!errors.slug} />
          <span className="small muted">/products/{form.slug || "…"}</span>
          {errors.slug && <span className="field-error">{errors.slug}</span>}
        </label>
        <label className="field">
          <span>카테고리</span>
          <select className="select" value={categoryId} onChange={(e) => set("categoryId", Number(e.target.value))} aria-invalid={!!errors.categoryId}>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
        </label>
        <label className="field">
          <span>상태</span>
          <select className="select" value={form.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
            {(Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map((s) => (
              <option key={s} value={s}>
                {PRODUCT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>판매가 (원)</span>
          <input className="input" inputMode="numeric" value={form.price || ""} onChange={(e) => set("price", Number(e.target.value.replace(/\D/g, "")))} aria-invalid={!!errors.price} />
          {errors.price && <span className="field-error">{errors.price}</span>}
        </label>
        <label className="field">
          <span>정가 (할인 시에만, 원)</span>
          <input
            className="input"
            inputMode="numeric"
            value={form.originalPrice || ""}
            onChange={(e) => set("originalPrice", Number(e.target.value.replace(/\D/g, "")) || null)}
            aria-invalid={!!errors.originalPrice}
          />
          {errors.originalPrice && <span className="field-error">{errors.originalPrice}</span>}
        </label>
        <label className="field">
          <span>배지</span>
          <select className="select" value={form.badge ?? ""} onChange={(e) => set("badge", (e.target.value || null) as Badge | null)}>
            <option value="">없음</option>
            <option value="NEW">NEW</option>
            <option value="BEST">BEST</option>
            <option value="LIMITED">LIMITED</option>
            <option value="SALE">SALE</option>
          </select>
        </label>
        <label className="field">
          <span>추천 순서 (작을수록 앞, 선택)</span>
          <input
            className="input"
            inputMode="numeric"
            value={form.featuredRank ?? ""}
            onChange={(e) => set("featuredRank", e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")))}
          />
        </label>
        <label className="field span-2">
          <span>상품 설명</span>
          <textarea className="textarea" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="field">
          <span>소재</span>
          <input className="input" value={form.material ?? ""} onChange={(e) => set("material", e.target.value)} placeholder="울 80%, 나일론 20%" />
        </label>
        <label className="field">
          <span>핏</span>
          <input className="input" value={form.fit ?? ""} onChange={(e) => set("fit", e.target.value)} placeholder="오버핏" />
        </label>
        <label className="field span-2">
          <span>세탁 방법 (한 줄에 하나)</span>
          <textarea className="textarea" style={{ minHeight: 80 }} value={careText} onChange={(e) => setCareText(e.target.value)} placeholder={"드라이클리닝\n그늘에서 건조"} />
        </label>
      </div>
      {formError && <p className="form-error">{formError}</p>}
      <div>
        <button className="btn" disabled={busy}>
          {busy ? "저장 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
