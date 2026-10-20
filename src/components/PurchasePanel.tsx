import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../domain/types';
import { maxQuantity, variantStock } from '../lib/pricing';
import { useStore } from '../state/store';
import { HeartIcon } from './Icons';
import { Price } from './Price';
import { formatKRW } from '../lib/format';

interface Props {
  product: Product;
  mode?: 'full' | 'quick';
  onAdded?: () => void;
  onSizeGuide?: () => void;
  onColorChange?: (colorId: string) => void;
}

export function PurchasePanel({ product, mode = 'full', onAdded, onSizeGuide, onColorChange }: Props) {
  const { addToCart, notify, toggleWishlist, isWishlisted, setCartOpen } = useStore();
  const navigate = useNavigate();
  const [colorId, setColorId] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<{ color?: string; size?: string; form?: string }>({});
  const uid = useId();

  const stock = colorId && size ? variantStock(product, colorId, size) : null;
  const max = colorId && size ? maxQuantity(product, colorId, size) : 5;
  const colorName = product.colors.find((c) => c.id === colorId)?.name;
  const wished = isWishlisted(product.id);

  function sizeAvailable(s: string) {
    if (colorId) return variantStock(product, colorId, s) > 0;
    return product.colors.some((c) => variantStock(product, c.id, s) > 0);
  }

  function chooseColor(id: string) {
    setColorId(id);
    onColorChange?.(id);
    setErrors((e) => ({ ...e, color: undefined, form: undefined }));
    if (size && variantStock(product, id, size) <= 0) setSize(null);
    setQuantity(1);
  }

  function chooseSize(s: string) {
    setSize(s);
    setErrors((e) => ({ ...e, size: undefined, form: undefined }));
    setQuantity((q) => Math.max(1, Math.min(q, colorId ? maxQuantity(product, colorId, s) : 5)));
  }

  function submit(buyNow: boolean) {
    const next: typeof errors = {};
    if (!colorId) next.color = '색상을 선택해 주세요.';
    if (!size) next.size = '사이즈를 선택해 주세요.';
    if (next.color || next.size) {
      setErrors(next);
      document.getElementById(`${uid}-${next.color ? 'color' : 'size'}`)?.focus();
      return;
    }
    const result = addToCart(product.id, colorId!, size!, quantity);
    if (!result.ok) {
      setErrors({ form: result.reason });
      return;
    }
    setErrors({});
    if (buyNow) {
      navigate('/checkout');
      return;
    }
    notify(
      result.capped ? `담겼습니다. 이 옵션은 최대 ${result.quantity}개까지 구매할 수 있어요.` : `${product.name} (${colorName}, ${size})을(를) 장바구니에 담았습니다.`,
      { label: '장바구니 보기', to: '/cart' },
    );
    onAdded?.();
    if (mode === 'full') setCartOpen(true);
  }

  function wish() {
    const added = toggleWishlist(product.id);
    notify(added ? `${product.name}을(를) 위시리스트에 저장했습니다.` : `${product.name}을(를) 위시리스트에서 삭제했습니다.`, added ? { label: '위시리스트 보기', to: '/wishlist' } : undefined);
  }

  return (
    <div className="stack">
      <div>
        <p className="option-label">
          <span id={`${uid}-color-label`}>색상{colorName ? `: ${colorName}` : ''}</span>
        </p>
        <div
          className="swatches"
          role="radiogroup"
          aria-labelledby={`${uid}-color-label`}
          aria-describedby={errors.color ? `${uid}-color-err` : undefined}
          aria-invalid={!!errors.color}
          id={`${uid}-color`}
          tabIndex={-1}
        >
          {product.colors.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={colorId === c.id}
              aria-label={c.name}
              title={c.name}
              className="swatch"
              style={{ background: c.hex }}
              onClick={() => chooseColor(c.id)}
            />
          ))}
        </div>
        {errors.color && (
          <p className="error-text" id={`${uid}-color-err`} role="alert">
            {errors.color}
          </p>
        )}
      </div>

      <div>
        <p className="option-label">
          <span id={`${uid}-size-label`}>사이즈{size ? `: ${size}` : ''}</span>
          {onSizeGuide && (
            <button type="button" className="btn-text" onClick={onSizeGuide}>
              사이즈 가이드
            </button>
          )}
        </p>
        <div
          className="size-grid"
          role="radiogroup"
          aria-labelledby={`${uid}-size-label`}
          aria-describedby={errors.size ? `${uid}-size-err` : undefined}
          aria-invalid={!!errors.size}
          id={`${uid}-size`}
          tabIndex={-1}
        >
          {product.sizes.map((s) => {
            const available = sizeAvailable(s);
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                className="size-option"
                disabled={!available}
                aria-label={available ? s : `${s}, 품절`}
                onClick={() => chooseSize(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
        {errors.size && (
          <p className="error-text" id={`${uid}-size-err`} role="alert">
            {errors.size}
          </p>
        )}
      </div>

      <p className="stock-note" aria-live="polite">
        {stock === null ? (
          <span className="muted">색상과 사이즈를 선택하면 재고를 확인할 수 있어요.</span>
        ) : stock === 0 ? (
          <span className="stock-low">선택한 옵션은 품절입니다.</span>
        ) : stock <= 3 ? (
          <span className="stock-low">이 옵션은 {stock}개 남았어요.</span>
        ) : (
          <span>재고 있음 · 영업일 기준 1~2일 내 출고</span>
        )}
      </p>

      <div>
        <p className="option-label">
          <span id={`${uid}-qty`}>수량</span>
          <span className="muted">옵션당 최대 {max}개</span>
        </p>
        <div className="qty" role="group" aria-labelledby={`${uid}-qty`}>
          <button type="button" aria-label="수량 줄이기" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
            −
          </button>
          <output aria-live="polite" aria-label={`수량 ${quantity}`}>
            {quantity}
          </output>
          <button type="button" aria-label="수량 늘리기" onClick={() => setQuantity((q) => Math.min(max, q + 1))} disabled={quantity >= max}>
            +
          </button>
        </div>
      </div>

      {errors.form && (
        <p className="notice notice-error" role="alert">
          {errors.form}
        </p>
      )}

      <div className="pdp-actions" style={mode === 'quick' ? { gridTemplateColumns: '1fr' } : undefined}>
        <button type="button" className="btn btn-primary" onClick={() => submit(false)} disabled={stock === 0}>
          장바구니 담기
        </button>
        {mode === 'full' && (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => submit(true)} disabled={stock === 0}>
              바로 구매
            </button>
            <button type="button" className="icon-btn" style={{ border: '1px solid var(--line-strong)', height: 48, width: 48 }} aria-pressed={wished} aria-label={wished ? '위시리스트에서 삭제' : '위시리스트에 추가'} onClick={wish}>
              <HeartIcon filled={wished} />
            </button>
          </>
        )}
      </div>

      {mode === 'full' && (
        <div className="sticky-buy" aria-label="빠른 구매">
          <div style={{ fontSize: 13 }}>
            <div>{product.name}</div>
            <Price product={product} />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => submit(false)} disabled={stock === 0}>
            담기 · {formatKRW(product.price * quantity)}
          </button>
        </div>
      )}
    </div>
  );
}
