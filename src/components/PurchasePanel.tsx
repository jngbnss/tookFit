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
  initialColor?: string;
}

export function PurchasePanel({ product, mode = 'full', onAdded, onSizeGuide, initialColor }: Props) {
  const { addToCart, notify, toggleWishlist, isWishlisted, setCartOpen } = useStore();
  const navigate = useNavigate();
  const [colorId, setColorId] = useState<string | null>(initialColor ?? null);
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
    if (!colorId) next.color = 'Please select a color.';
    if (!size) next.size = 'Please select a size.';
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
      result.capped
        ? `Added — quantity limited to ${result.quantity} for this option.`
        : `${product.name} (${colorName}, ${size}) added to your bag.`,
      { label: 'View bag', to: '/cart' },
    );
    onAdded?.();
    if (mode === 'full') setCartOpen(true);
  }

  function wish() {
    const added = toggleWishlist(product.id);
    notify(added ? `${product.name} saved to your wishlist.` : `${product.name} removed from your wishlist.`, added ? { label: 'View wishlist', to: '/wishlist' } : undefined);
  }

  return (
    <div className="stack">
      <div>
        <p className="option-label">
          <span id={`${uid}-color-label`}>
            Color{colorName ? `: ${colorName}` : ''}
          </span>
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
          <span id={`${uid}-size-label`}>Size{size ? `: ${size}` : ''}</span>
          {onSizeGuide && (
            <button type="button" className="btn-text" onClick={onSizeGuide}>
              Size guide
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
                aria-label={available ? s : `${s}, sold out`}
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
          <span className="muted">Select a color and size to see availability.</span>
        ) : stock === 0 ? (
          <span className="stock-low">Sold out in this option.</span>
        ) : stock <= 3 ? (
          <span className="stock-low">Only {stock} left in this option.</span>
        ) : (
          <span>In stock — ships in 1–2 business days.</span>
        )}
      </p>

      <div>
        <p className="option-label">
          <span id={`${uid}-qty`}>Quantity</span>
          <span className="muted">Max {max} per option</span>
        </p>
        <div className="qty" role="group" aria-labelledby={`${uid}-qty`}>
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
            −
          </button>
          <output aria-live="polite" aria-label={`Quantity ${quantity}`}>
            {quantity}
          </output>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(max, q + 1))} disabled={quantity >= max}>
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
          Add to bag
        </button>
        {mode === 'full' && (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => submit(true)} disabled={stock === 0}>
              Buy now
            </button>
            <button type="button" className="icon-btn" style={{ border: '1px solid var(--line-strong)', height: 48, width: 48 }} aria-pressed={wished} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} onClick={wish}>
              <HeartIcon filled={wished} />
            </button>
          </>
        )}
      </div>

      {mode === 'full' && (
        <div className="sticky-buy" aria-label="Quick purchase">
          <div style={{ fontSize: 13 }}>
            <div>{product.name}</div>
            <Price product={product} />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => submit(false)} disabled={stock === 0}>
            Add · {formatKRW(product.price * quantity)}
          </button>
        </div>
      )}
    </div>
  );
}
