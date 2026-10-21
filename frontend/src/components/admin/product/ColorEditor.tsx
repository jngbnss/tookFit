"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminProductDetail, ColorInput } from "@/lib/api/types";

export function ColorEditor({ product, onSaved }: { product: AdminProductDetail; onSaved: (p: AdminProductDetail) => void }) {
  const [colors, setColors] = useState<ColorInput[]>(
    [...product.colors].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => ({ id: c.id, name: c.name, hex: c.hex, sortOrder: c.sortOrder })),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (i: number, patch: Partial<ColorInput>) => setColors((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, d: number) =>
    setColors((cs) => {
      const next = [...cs];
      const j = i + d;
      if (j < 0 || j >= next.length) return cs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="panel stack">
      {colors.length === 0 && <p className="small muted">색상을 하나 이상 추가해주세요. 색상이 하나뿐인 상품도 이름을 정해주세요 (예: 블랙).</p>}
      <ul className="stack-sm">
        {colors.map((c, i) => (
          <li key={c.id ?? `new-${i}`} className="row" style={{ flexWrap: "nowrap" }}>
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000"} onChange={(e) => set(i, { hex: e.target.value })} aria-label="색상 값" style={{ width: 44, height: 40, padding: 0, border: 0 }} />
            <input className="input" style={{ maxWidth: 220 }} value={c.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="색상 이름" aria-label="색상 이름" />
            <input className="input" style={{ maxWidth: 110 }} value={c.hex} onChange={(e) => set(i, { hex: e.target.value })} aria-label="HEX" />
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">
              ↑
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => move(i, 1)} disabled={i === colors.length - 1} aria-label="아래로">
              ↓
            </button>
            <button type="button" className="link small accent" onClick={() => setColors((cs) => cs.filter((_, j) => j !== i))}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setColors((cs) => [...cs, { name: "", hex: "#111111", sortOrder: cs.length }])}>
          + 색상 추가
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={busy}
          onClick={async () => {
            if (colors.some((c) => !c.name.trim() || !/^#[0-9a-fA-F]{6}$/.test(c.hex))) return setError("모든 색상의 이름과 HEX 값(#000000 형식)을 확인해주세요.");
            setBusy(true);
            setError(null);
            try {
              const saved = await adminApi.saveColors(
                product.id,
                colors.map((c, i) => ({ ...c, name: c.name.trim(), sortOrder: i })),
              );
              setColors(saved.colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex, sortOrder: c.sortOrder })));
              onSaved(saved);
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          색상 저장
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
