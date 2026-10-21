"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Color, SortKey } from "@/lib/api/types";

const SIZE_GROUPS = [
  ["S", "M", "L", "XL", "FREE"],
  ["28", "30", "32", "34", "36"],
  ["250", "260", "270", "280", "290"],
];

const SORT_LABEL: Record<SortKey, string> = {
  featured: "추천순",
  newest: "신상품순",
  "price-asc": "낮은 가격순",
  "price-desc": "높은 가격순",
};

/** URL 쿼리를 바꾸는 공통 훅. 필터가 바뀌면 1페이지로 돌아간다. */
function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    const s = next.toString();
    router.push(`${pathname}${s ? `?${s}` : ""}`, { scroll: false });
  };
}

export function SortSelect({ value }: { value: SortKey }) {
  const update = useQueryUpdater();
  return (
    <label className="row small">
      <span className="sr-only">정렬</span>
      <select className="select" style={{ width: "auto", minHeight: 36 }} value={value} onChange={(e) => update({ sort: e.target.value })}>
        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABEL[k]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CatalogFilters({ colors }: { basePath: string; colors: Color[] }) {
  const params = useSearchParams();
  const update = useQueryUpdater();
  const sizes = (params.get("sizes") ?? "").split(",").filter(Boolean);
  const selectedColors = (params.get("colors") ?? "").split(",").filter(Boolean);

  const toggle = (key: "sizes" | "colors", current: string[], value: string) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [key]: next.join(",") || null });
  };

  // 선택은 되어 있는데 이번 결과에 없는 색상도 해제할 수 있게 보여준다
  const colorOptions = [
    ...colors.map((c) => ({ name: c.name, hex: c.hex })),
    ...selectedColors.filter((n) => !colors.some((c) => c.name === n)).map((n) => ({ name: n, hex: "transparent" })),
  ];

  const hasFilter = sizes.length || selectedColors.length || params.get("minPrice") || params.get("maxPrice") || params.get("inStock");

  return (
    <aside className="filters" aria-label="필터">
      {params.get("q") && (
        <div>
          <h3>검색어</h3>
          <button type="button" className="chip" aria-pressed="true" onClick={() => update({ q: null })}>
            {params.get("q")} ✕
          </button>
        </div>
      )}
      <div>
        <h3>사이즈</h3>
        <div className="stack-sm">
          {SIZE_GROUPS.map((group) => (
            <div className="chips" key={group[0]}>
              {group.map((s) => (
                <button key={s} type="button" className="chip" aria-pressed={sizes.includes(s)} onClick={() => toggle("sizes", sizes, s)}>
                  {s}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {colorOptions.length > 0 && (
        <div>
          <h3>색상</h3>
          <div className="chips">
            {colorOptions.map((c) => (
              <button
                key={c.name}
                type="button"
                className="chip row"
                style={{ gap: 6 }}
                aria-pressed={selectedColors.includes(c.name)}
                onClick={() => toggle("colors", selectedColors, c.name)}
              >
                <span className="swatch-dot" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <PriceFilter
        key={`${params.get("minPrice")}|${params.get("maxPrice")}`}
        initialMin={params.get("minPrice") ?? ""}
        initialMax={params.get("maxPrice") ?? ""}
        onApply={(min, max) => update({ minPrice: min || null, maxPrice: max || null })}
      />
      <label className="check">
        <input type="checkbox" checked={params.get("inStock") === "true"} onChange={(e) => update({ inStock: e.target.checked ? "true" : null })} />
        재고 있는 상품만
      </label>
      {hasFilter ? (
        <button
          type="button"
          className="link small"
          style={{ alignSelf: "flex-start" }}
          onClick={() => update({ sizes: null, colors: null, minPrice: null, maxPrice: null, inStock: null })}
        >
          필터 초기화
        </button>
      ) : null}
    </aside>
  );
}

function PriceFilter({
  initialMin,
  initialMax,
  onApply,
}: {
  initialMin: string;
  initialMax: string;
  onApply: (min: string, max: string) => void;
}) {
  const [minPrice, setMinPrice] = useState(initialMin);
  const [maxPrice, setMaxPrice] = useState(initialMax);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(minPrice, maxPrice);
      }}
    >
      <h3>가격</h3>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <input className="input" inputMode="numeric" placeholder="최소" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))} aria-label="최소 가격" />
        <span>~</span>
        <input className="input" inputMode="numeric" placeholder="최대" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))} aria-label="최대 가격" />
      </div>
      <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }}>
        적용
      </button>
    </form>
  );
}
