"use client";

import { useMemo, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminProductDetail, VariantInput } from "@/lib/api/types";

const PRESETS: Record<string, string[]> = {
  "상의 (S~XL)": ["S", "M", "L", "XL"],
  "하의 (28~36)": ["28", "30", "32", "34", "36"],
  "신발 (250~290)": ["250", "260", "270", "280", "290"],
  "FREE": ["FREE"],
};

type Cell = { id?: number; sku?: string; stock: number; active: boolean; enabled: boolean };
const key = (colorId: number, size: string) => `${colorId}|${size}`;

/** 색상 × 사이즈 표로 옵션과 재고를 한 번에 편집한다. 칸을 끄면 그 옵션은 판매 중지된다. */
export function VariantGrid({ product, onSaved }: { product: AdminProductDetail; onSaved: (p: AdminProductDetail) => void }) {
  const initialSizes = useMemo(() => {
    const seen: string[] = [];
    product.variants.forEach((v) => {
      if (!seen.includes(v.size)) seen.push(v.size);
    });
    return seen;
  }, [product.variants]);

  const [sizes, setSizes] = useState<string[]>(initialSizes);
  const [cells, setCells] = useState<Record<string, Cell>>(() => {
    const map: Record<string, Cell> = {};
    product.variants.forEach((v) => {
      map[key(v.colorId, v.size)] = { id: v.id, sku: v.sku, stock: v.stock, active: v.active, enabled: v.active };
    });
    return map;
  });
  const [newSize, setNewSize] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const colors = [...product.colors].sort((a, b) => a.sortOrder - b.sortOrder);
  const cell = (c: number, s: string): Cell => cells[key(c, s)] ?? { stock: 0, active: true, enabled: false };
  const setCell = (c: number, s: string, patch: Partial<Cell>) => setCells((m) => ({ ...m, [key(c, s)]: { ...cell(c, s), ...patch } }));

  const addSizes = (list: string[]) => {
    setSizes((cur) => {
      const next = [...cur];
      list.forEach((s) => {
        if (!next.includes(s)) next.push(s);
      });
      return next;
    });
    // 새 사이즈는 모든 색상에서 켜진 상태로 시작한다
    setCells((m) => {
      const next = { ...m };
      colors.forEach((c) =>
        list.forEach((s) => {
          if (!next[key(c.id, s)]) next[key(c.id, s)] = { stock: 0, active: true, enabled: true };
        }),
      );
      return next;
    });
  };

  if (!colors.length) return <p className="panel small muted">색상을 먼저 저장해주세요.</p>;

  return (
    <div className="panel stack">
      <div className="row small">
        <span className="muted">사이즈 추가:</span>
        {Object.entries(PRESETS).map(([label, list]) => (
          <button key={label} type="button" className="chip" onClick={() => addSizes(list)}>
            {label}
          </button>
        ))}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const s = newSize.trim().toUpperCase();
            if (s) addSizes([s]);
            setNewSize("");
          }}
        >
          <input className="input" style={{ width: 90, minHeight: 32 }} placeholder="직접 입력" value={newSize} onChange={(e) => setNewSize(e.target.value)} maxLength={10} />
          <button className="btn btn-sm btn-ghost">추가</button>
        </form>
      </div>

      {sizes.length === 0 ? (
        <p className="small muted">사이즈를 추가해주세요.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>색상 \ 사이즈</th>
                {sizes.map((s) => (
                  <th key={s}>
                    {s}{" "}
                    {!product.variants.some((v) => v.size === s) && (
                      <button type="button" className="muted" aria-label={`${s} 빼기`} onClick={() => setSizes((cur) => cur.filter((x) => x !== s))}>
                        ✕
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="row" style={{ gap: 6 }}>
                      <span className="swatch-dot" style={{ background: c.hex }} />
                      {c.name}
                    </span>
                  </td>
                  {sizes.map((s) => {
                    const v = cell(c.id, s);
                    return (
                      <td key={s}>
                        <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <input type="checkbox" checked={v.enabled} onChange={(e) => setCell(c.id, s, { enabled: e.target.checked })} aria-label={`${c.name} ${s} 판매`} />
                          <input
                            className="input"
                            style={{ width: 70 }}
                            inputMode="numeric"
                            disabled={!v.enabled}
                            value={v.stock}
                            onChange={(e) => setCell(c.id, s, { stock: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                            aria-label={`${c.name} ${s} 재고`}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted">체크를 끄면 판매 중지돼요 (주문 기록이 있어 옵션은 지우지 않아요). SKU는 비워 두면 자동으로 만들어져요.</p>
      <div>
        <button
          type="button"
          className="btn btn-sm"
          disabled={busy}
          onClick={async () => {
            const payload: VariantInput[] = [];
            colors.forEach((c) =>
              sizes.forEach((s) => {
                const v = cells[key(c.id, s)];
                if (!v) return;
                if (!v.enabled && !v.id) return; // 새로 만들지 않은 빈 칸
                payload.push({ id: v.id, colorId: c.id, size: s, sku: v.sku, stock: v.stock, active: v.enabled });
              }),
            );
            setBusy(true);
            setError(null);
            try {
              onSaved(await adminApi.saveVariants(product.id, payload));
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          옵션·재고 저장
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
