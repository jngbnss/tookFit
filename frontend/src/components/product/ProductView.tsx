"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { errorMessage } from "@/lib/api/client";
import type { ProductDetail } from "@/lib/api/types";
import { BADGE_LABEL, formatPrice } from "@/lib/format";
import { HeartIcon } from "../Icons";
import { Price, Stars } from "../Price";
import { useAuth } from "../providers/Auth";
import { useCart } from "../providers/Cart";
import { useSettings } from "../providers/Settings";
import { useToast } from "../providers/Toast";
import { useWishlist } from "../providers/Wishlist";

/** 주문서로 넘길 "바로 구매" 항목. 장바구니를 거치지 않는다. */
export const BUY_NOW_KEY = "tukfit.buyNow";

export function ProductView({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { me } = useAuth();
  const cart = useCart();
  const settings = useSettings();
  const wishlist = useWishlist();
  const { notify } = useToast();

  // 재고가 있는 첫 색상을 기본으로 고른다
  const firstColor =
    product.colors.find((c) => product.variants.some((v) => v.colorId === c.id && v.available))?.id ?? product.colors[0]?.id;
  const [colorId, setColorId] = useState<number | undefined>(firstColor);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.colorId === colorId);
    const common = product.images.filter((i) => i.colorId == null);
    const list = forColor.length ? [...forColor, ...common] : product.images;
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [product.images, colorId]);

  const variant = product.variants.find((v) => v.colorId === colorId && v.size === size);
  const color = product.colors.find((c) => c.id === colorId);
  const maxQty = Math.max(1, Math.min(settings.maxQuantityPerItem, variant?.stock ?? settings.maxQuantityPerItem));
  const current = images[Math.min(imageIndex, images.length - 1)];

  const pick = () => {
    let message: string | null = null;
    if (!colorId) message = "색상을 선택해주세요.";
    else if (!size || !variant) message = "사이즈를 선택해주세요.";
    else if (!variant.available || variant.stock < 1) message = "선택한 옵션은 품절이에요.";
    setError(message);
    return message ? null : variant;
  };

  const addToCart = async () => {
    const v = pick();
    if (!v) return;
    setBusy(true);
    try {
      await cart.add({
        variantId: v.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        colorName: color?.name ?? "",
        size: v.size,
        imageUrl: images[0]?.url ?? product.thumbnailUrl,
        unitPrice: product.price,
        originalPrice: product.originalPrice,
        quantity: Math.min(qty, maxQty),
        stock: v.stock,
      });
      notify(`장바구니에 담았어요.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const buyNow = () => {
    const v = pick();
    if (!v) return;
    try {
      sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify([{ variantId: v.id, quantity: Math.min(qty, maxQty) }]));
    } catch {
      // sessionStorage를 못 쓰면 장바구니에 담아서 진행한다
      return addToCart().then(() => router.push("/checkout"));
    }
    const target = "/checkout?mode=buy-now";
    router.push(me ? target : `/login?redirect=${encodeURIComponent(target)}`);
  };

  return (
    <div className="pdp">
      <div>
        <div className="gallery-main">
          {current ? <img src={current.url} alt={current.alt ?? product.name} width={1024} height={1280} /> : null}
        </div>
        {images.length > 1 && (
          <div className="thumbs" role="group" aria-label="상품 사진">
            {images.map((img, i) => (
              <button key={img.id} type="button" aria-pressed={i === imageIndex} aria-label={`${i + 1}번째 사진`} onClick={() => setImageIndex(i)}>
                <img src={img.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="purchase">
        <div className="stack-sm">
          <p className="small muted">
            <Link href={`/shop/${product.category.slug}`}>{product.category.name}</Link>
            {product.badge && <> · {BADGE_LABEL[product.badge]}</>}
          </p>
          <h1>{product.name}</h1>
          <Price price={product.price} originalPrice={product.originalPrice} />
          {product.rating.count > 0 && (
            <a href="#reviews" className="rating">
              <Stars value={product.rating.average} /> {product.rating.average.toFixed(1)} · 리뷰 {product.rating.count}
            </a>
          )}
        </div>

        {product.colors.length > 0 && (
          <div>
            <p className="option-label">색상: {color?.name ?? "선택"}</p>
            <div className="color-options">
              {product.colors.map((c) => {
                const soldOut = !product.variants.some((v) => v.colorId === c.id && v.available && v.stock > 0);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="color-option"
                    style={{ background: c.hex, opacity: soldOut ? 0.4 : 1 }}
                    aria-pressed={c.id === colorId}
                    aria-label={`${c.name}${soldOut ? " (품절)" : ""}`}
                    title={c.name}
                    onClick={() => {
                      setColorId(c.id);
                      setImageIndex(0);
                      setQty(1);
                      setError(null);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="option-label">사이즈</p>
          <div className="size-options">
            {product.sizes.map((s) => {
              const v = product.variants.find((x) => x.colorId === colorId && x.size === s);
              const disabled = !v || !v.available || v.stock < 1;
              return (
                <button
                  key={s}
                  type="button"
                  className="size-option"
                  disabled={disabled}
                  aria-pressed={size === s}
                  aria-label={`${s}${disabled ? " 품절" : ""}`}
                  onClick={() => {
                    setSize(s);
                    setQty(1);
                    setError(null);
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {variant && variant.stock > 0 && variant.stock <= 3 && <p className="small accent" style={{ marginTop: 6 }}>남은 수량 {variant.stock}개</p>}
        </div>

        <div className="row">
          <div className="qty" aria-label="수량">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="수량 줄이기">
              −
            </button>
            <span aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="수량 늘리기">
              +
            </button>
          </div>
          <span className="small muted">최대 {settings.maxQuantityPerItem}개</span>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <div className="row" style={{ flexWrap: "nowrap" }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={addToCart} disabled={busy || !product.inStock}>
            {product.inStock ? "장바구니 담기" : "품절"}
          </button>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={buyNow} disabled={busy || !product.inStock}>
            바로 구매
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ border: "1px solid var(--line-strong)", borderRadius: 0, width: 48, height: 48, flex: "none" }}
            aria-pressed={wishlist.has(product.id)}
            aria-label="위시리스트"
            onClick={() => wishlist.toggle(product.id, product.name)}
          >
            <HeartIcon filled={wishlist.has(product.id)} />
          </button>
        </div>

        <p className="small muted">
          {formatPrice(settings.freeShippingThreshold)} 이상 무료배송 · 기본 배송비 {formatPrice(settings.shippingFee)}
        </p>

        <div className="accordion">
          {product.description && (
            <details open>
              <summary>상품 설명</summary>
              <p className="prose" style={{ marginTop: 10 }}>
                {product.description}
              </p>
            </details>
          )}
          <details>
            <summary>소재·핏·세탁</summary>
            <dl className="details">
              {product.material && (
                <>
                  <dt>소재</dt>
                  <dd>{product.material}</dd>
                </>
              )}
              {product.fit && (
                <>
                  <dt>핏</dt>
                  <dd>{product.fit}</dd>
                </>
              )}
              {product.care.length > 0 && (
                <>
                  <dt>세탁</dt>
                  <dd>{product.care.join("\n")}</dd>
                </>
              )}
            </dl>
          </details>
          <details>
            <summary>배송·교환·반품</summary>
            <p className="small" style={{ marginTop: 10 }}>
              기본 배송비 {formatPrice(settings.shippingFee)}, {formatPrice(settings.freeShippingThreshold)} 이상 무료배송. 상품 수령 후 7일 이내
              교환·반품을 신청할 수 있어요. 단순 변심은 왕복 배송비 {formatPrice(settings.returnShippingFee)}이 들어요.{" "}
              <Link className="link" href="/policy/shipping-returns">
                자세히
              </Link>
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
