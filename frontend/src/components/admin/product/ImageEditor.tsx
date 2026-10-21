"use client";

import { useState } from "react";
import { adminApi, uploadImage } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminProductDetail } from "@/lib/api/types";

type Item = { id?: number; storageKey: string; url: string; alt: string; colorId: number | null };

export function ImageEditor({ product, onSaved }: { product: AdminProductDetail; onSaved: (p: AdminProductDetail) => void }) {
  const [items, setItems] = useState<Item[]>(
    [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ id: i.id, storageKey: i.storageKey, url: i.url, alt: i.alt ?? "", colorId: i.colorId ?? null })),
  );
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (i: number, patch: Partial<Item>) => setItems((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) =>
    setItems((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: 10MB 이하 이미지만 올릴 수 있어요.`);
        const { storageKey, publicUrl } = await uploadImage(file, "products");
        setItems((cur) => [...cur, { storageKey, url: publicUrl, alt: product.name, colorId: null }]);
      } catch (e) {
        setError(e instanceof Error && !("code" in e) ? e.message : errorMessage(e));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  return (
    <div className="panel stack">
      <p className="small muted">첫 번째 사진이 대표 사진이에요. 색상을 지정하면 상세 페이지에서 그 색상을 골랐을 때 보여요. 4:5 비율, 1200×1500px 정도를 권장해요.</p>
      {items.length > 0 && (
        <div className="image-grid">
          {items.map((it, i) => (
            <figure key={it.storageKey}>
              <img src={it.url} alt={it.alt} />
              <select className="select" style={{ minHeight: 30, fontSize: 12, padding: 4 }} value={it.colorId ?? ""} onChange={(e) => set(i, { colorId: e.target.value ? Number(e.target.value) : null })} aria-label="색상 연결">
                <option value="">공통</option>
                {product.colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input className="input" style={{ minHeight: 30, fontSize: 12, padding: 4 }} value={it.alt} onChange={(e) => set(i, { alt: e.target.value })} placeholder="대체 텍스트" aria-label="대체 텍스트" />
              <div className="row between">
                <span className="row" style={{ gap: 2 }}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="앞으로">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="뒤로">
                    →
                  </button>
                </span>
                {i === 0 && <strong>대표</strong>}
                <button type="button" className="accent" onClick={() => setItems((list) => list.filter((_, j) => j !== i))}>
                  삭제
                </button>
              </div>
            </figure>
          ))}
        </div>
      )}
      <div className="row">
        <label className="btn btn-sm btn-ghost">
          사진 올리기
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }} />
        </label>
        {uploading > 0 && <span className="small muted">{uploading}장 올리는 중…</span>}
        <button
          type="button"
          className="btn btn-sm"
          disabled={busy || uploading > 0}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              onSaved(
                await adminApi.saveImages(
                  product.id,
                  items.map((it, i) => ({ id: it.id, storageKey: it.storageKey, alt: it.alt.trim() || undefined, colorId: it.colorId, sortOrder: i })),
                ),
              );
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          사진 순서·설정 저장
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
