import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutGrid, Move, Plus, Search, Shuffle } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { MOODS, type MoodId } from '../data/moods';
import type { CategorySlug, Product, SortKey } from '../domain/types';
import { DEFAULT_QUERY, filterProducts, primaryImage } from '../lib/catalog';
import { asset, formatKRW } from '../lib/format';
import { discountPercent } from '../lib/pricing';
import { moodStyle, useMood } from '../cinematic/MoodContext';
import { useDragToCart } from '../cinematic/DragToCart';
import { ProductGrid } from '../components/ProductCard';
import { RatingBadge } from '../components/Reviews';
import { usePageMeta } from '../components/usePageMeta';

type View = 'canvas' | 'list';

/** Deterministic pseudo-random scatter so the canvas looks organic but stable. */
function jitter(seed: string, range: number) {
  let h = 0;
  for (const ch of seed) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return ((h % 1000) / 1000 - 0.5) * 2 * range;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || 1200);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return [ref, width] as const;
}

function CanvasCard({ product, x, y, rotate, constraints }: { product: Product; x: number; y: number; rotate: number; constraints: RefObject<HTMLDivElement | null> }) {
  const dnd = useDragToCart();
  const navigate = useNavigate();
  const dragged = useRef(false);
  const [z, setZ] = useState(1);
  const img = primaryImage(product);
  const pct = discountPercent(product);

  return (
    <motion.div
      className="canvas-card"
      style={{ left: x, top: y, zIndex: z, rotate }}
      drag
      dragConstraints={constraints}
      dragElastic={0.15}
      dragMomentum={false}
      onDragStart={() => {
        dragged.current = true;
        setZ(40);
        dnd.start(product);
      }}
      onDrag={(_, info) => dnd.move({ x: info.point.x - window.scrollX, y: info.point.y - window.scrollY })}
      onDragEnd={(_, info) => {
        dnd.end({ x: info.point.x - window.scrollX, y: info.point.y - window.scrollY });
        window.setTimeout(() => (dragged.current = false), 0);
      }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="canvas-card-link"
        draggable={false}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onClick={(e) => {
          e.preventDefault();
          if (!dragged.current) navigate(`/product/${product.slug}`);
        }}
        aria-label={`${product.name}, ${formatKRW(product.price)}. 상세 보기`}
      >
        <img src={asset(img.src)} alt={img.alt} loading="lazy" width={1024} height={1280} draggable={false} />
        {pct > 0 && <span className="canvas-sale">−{pct}%</span>}
      </Link>
      <div className="canvas-info">
        <p className="canvas-name">{product.name}</p>
        <p className="canvas-price">{formatKRW(product.price)}</p>
        <RatingBadge product={product} />
        <div className="canvas-swatches">
          {product.colors.map((c) => (
            <span key={c.id} style={{ background: c.hex }} title={c.name} />
          ))}
        </div>
      </div>
      <button
        type="button"
        className="canvas-add"
        aria-label={`${product.name} 장바구니에 담기`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => dnd.addDefault(product)}
      >
        <Plus size={16} />
      </button>
    </motion.div>
  );
}

export default function Explore() {
  const { mood, setMood } = useMood();
  const [params, setParams] = useSearchParams();
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
  const view = (params.get('view') as View | null) ?? (isNarrow ? 'list' : 'canvas');
  const category = (params.get('category') as CategorySlug | null) ?? null;
  const moodFilter = params.get('mood') === 'all' ? null : ((params.get('mood') as MoodId | null) ?? null);
  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as SortKey | null) ?? 'featured';
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [canvasRef, width] = useWidth<HTMLDivElement>();
  usePageMeta('탐색', '상품을 자유롭게 끌어보고 분위기별로 탐색하세요.');

  const activeMood = moodFilter ? MOODS.find((m) => m.id === moodFilter) ?? null : null;
  const results = useMemo(() => {
    const base = filterProducts(PRODUCTS, { ...DEFAULT_QUERY, q, categories: category ? [category] : [], sort });
    return activeMood ? base.filter((p) => activeMood.productIds.includes(p.id)) : base;
  }, [q, category, sort, activeMood]);

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const cardW = width < 640 ? 150 : 210;
  const cellW = cardW + (width < 640 ? 20 : 60);
  const cols = Math.max(2, Math.floor(width / cellW));
  const cellH = cardW * 1.25 + (width < 640 ? 90 : 120);
  const rows = Math.ceil(results.length / cols);
  const positions = results.map((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const seed = `${p.id}-${shuffleSeed}`;
    const spare = (width - cols * cellW) / 2;
    return {
      x: Math.max(0, spare + col * cellW + jitter(seed, cellW * 0.12)),
      y: row * cellH + (col % 2 ? cellH * 0.22 : 0) + jitter(seed + 'y', 24),
      rotate: jitter(seed + 'r', 5),
    };
  });

  const scoped = activeMood ?? mood;

  return (
    <div className="mood-scope explore" style={{ ...moodStyle(scoped), background: scoped.bg, color: scoped.ink }}>
      <div className="container explore-head">
        <h1 className="explore-title" style={activeMood ? { fontFamily: activeMood.font } : undefined}>
          {activeMood ? activeMood.label : category ? CATEGORIES.find((c) => c.slug === category)?.label : '탐색'}
        </h1>
        <p className="explore-sub">
          {view === 'canvas' ? '카드를 옮겨 나란히 비교하고, 장바구니 아이콘으로 끌어 담을 수 있습니다.' : '전체 상품을 목록으로 봅니다.'}
        </p>

        <div className="explore-toolbar">
          <label className="explore-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">상품 검색</span>
            <input type="search" placeholder="상품명, 소재, 색상으로 검색" value={q} onChange={(e) => set('q', e.target.value)} />
          </label>
          <label className="explore-sort">
            <span className="sr-only">정렬</span>
            <select value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? null : e.target.value)} aria-label="정렬">
              <option value="featured">추천순</option>
              <option value="newest">신상품순</option>
              <option value="price-asc">낮은 가격순</option>
              <option value="price-desc">높은 가격순</option>
            </select>
          </label>
          <div className="view-toggle" role="radiogroup" aria-label="보기 방식">
            <button type="button" role="radio" aria-checked={view === 'canvas'} onClick={() => set('view', 'canvas')}>
              <Move size={15} /> 캔버스
            </button>
            <button type="button" role="radio" aria-checked={view === 'list'} onClick={() => set('view', 'list')}>
              <LayoutGrid size={15} /> 목록
            </button>
          </div>
        </div>

        <div className="explore-chips" role="group" aria-label="카테고리">
          <button type="button" aria-pressed={!category} onClick={() => set('category', null)}>
            전체
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.slug} type="button" aria-pressed={category === c.slug} onClick={() => set('category', category === c.slug ? null : c.slug)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="explore-chips moods" role="group" aria-label="분위기">
          <button type="button" aria-pressed={!activeMood} onClick={() => set('mood', null)}>
            모든 분위기
          </button>
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={activeMood?.id === m.id}
              style={{ fontFamily: m.font }}
              onClick={() => {
                const off = activeMood?.id === m.id;
                set('mood', off ? null : m.id);
                if (!off) setMood(m.id);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="explore-meta">
          <span aria-live="polite">상품 {results.length}개</span>
          {view === 'canvas' && results.length > 0 && (
            <button type="button" className="btn-text" onClick={() => setShuffleSeed((s) => s + 1)}>
              <Shuffle size={14} /> 배치 초기화
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty container">
          <h2>조건에 맞는 상품이 없습니다</h2>
          <button type="button" className="cine-btn" onClick={() => setParams(new URLSearchParams({ view }), { replace: true })}>
            필터 초기화
          </button>
        </div>
      ) : view === 'list' ? (
        <div className="container" style={{ paddingBottom: 96 }}>
          <ProductGrid products={results} eagerCount={4} />
        </div>
      ) : (
        <div className="container">
          <div ref={canvasRef} className="canvas" style={{ height: rows * cellH + cellH * 0.4 }}>
            {results.map((p, i) => (
              <CanvasCard key={`${p.id}-${shuffleSeed}`} product={p} constraints={canvasRef} {...positions[i]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
