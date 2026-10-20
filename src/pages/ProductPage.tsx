import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CATEGORIES } from '../data/products';
import type { Product } from '../domain/types';
import { getProduct, getProductBySlug } from '../lib/catalog';
import { asset } from '../lib/format';
import { isInStock } from '../lib/pricing';
import { track } from '../lib/analytics';
import { useStore } from '../state/store';
import { Price } from '../components/Price';
import { PurchasePanel } from '../components/PurchasePanel';
import { SmartImage } from '../components/SmartImage';
import { Dialog } from '../components/Overlay';
import { ProductGrid } from '../components/ProductCard';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { ShareIcon } from '../components/Icons';
import { SizeTables } from './Info';
import { usePageMeta } from '../components/usePageMeta';
import NotFound from './NotFound';

function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const image = product.images[index];
  return (
    <div className="gallery">
      <div className="thumbs" role="group" aria-label="Product images">
        {product.images.map((img, i) => (
          <button key={img.src} type="button" aria-pressed={i === index} aria-label={`Show image ${i + 1} of ${product.images.length}`} onClick={() => setIndex(i)}>
            <SmartImage src={img.src} alt="" />
          </button>
        ))}
      </div>
      <button type="button" className="gallery-main" onClick={() => setZoom(true)} aria-label={`Enlarge image: ${image.alt}`}>
        <SmartImage src={image.src} alt={image.alt} eager />
      </button>
      <Dialog open={zoom} onClose={() => setZoom(false)} title={product.name} wide>
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Scroll to pan the enlarged image. Press Escape to close.
        </p>
        <div className="zoom-wrap" tabIndex={0} aria-label="Enlarged image, scrollable">
          <img src={asset(image.src)} alt={image.alt} width={1024} height={1280} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {product.images.map((img, i) => (
            <button key={img.src} type="button" className="chip" aria-pressed={i === index} onClick={() => setIndex(i)}>
              Image {i + 1}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}

function ShareButton({ product }: { product: Product }) {
  const { notify } = useStore();
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${product.name} | T.O.O.K FIT`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('Link copied to clipboard.');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      notify('Couldn’t share automatically — copy the address from your browser bar.');
    }
  }
  return (
    <button type="button" className="btn-text" onClick={share} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <span style={{ width: 16, display: 'inline-flex' }}>
        <ShareIcon />
      </span>
      Share
    </button>
  );
}

export default function ProductPage() {
  const { slug = '' } = useParams();
  const product = getProductBySlug(slug);
  const { addRecent } = useStore();
  const [sizeGuide, setSizeGuide] = useState(false);

  usePageMeta(
    product?.name ?? 'Product not found',
    product?.description.slice(0, 155),
    product && {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images.map((i) => new URL(asset(i.src), window.location.origin).href),
      sku: product.id,
      brand: { '@type': 'Brand', name: 'T.O.O.K FIT' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'KRW',
        price: product.price,
        availability: isInStock(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
  );

  useEffect(() => {
    if (!product) return;
    addRecent(product.id);
    track('product_view', { productId: product.id });
  }, [product, addRecent]);

  if (!product) return <NotFound />;

  const category = CATEGORIES.find((c) => c.slug === product.category)!;
  const related = product.relatedIds.map(getProduct).filter((p): p is Product => !!p);

  return (
    <div className="has-sticky-buy">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to={`/shop/${category.slug}`}>{category.label}</Link>
            </li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>
        <div className="pdp">
          <Gallery key={product.id} product={product} />
          <div className="pdp-info">
            <div>
              {product.badge && (
                <p className="eyebrow" style={{ color: product.badge === 'SALE' ? 'var(--accent)' : undefined }}>
                  {product.badge === 'NEW' ? 'New this season' : product.badge === 'BEST' ? 'Best seller' : product.badge === 'LIMITED' ? 'Limited run' : 'On sale'}
                </p>
              )}
              <h1>{product.name}</h1>
            </div>
            <Price product={product} className="pdp-price" />
            <p style={{ color: 'var(--ink-2)' }}>{product.description}</p>
            <PurchasePanel key={product.id} product={product} onSizeGuide={() => setSizeGuide(true)} />
            <div className="trust">
              <p>Free shipping on orders over ₩100,000</p>
              <p>Free returns within 14 days</p>
              <p>Ships from Seoul in 1–2 business days</p>
              <ShareButton product={product} />
            </div>
            <div className="accordion">
              <details open>
                <summary>Fit notes</summary>
                <div className="acc-body">
                  <p>{product.fit}</p>
                </div>
              </details>
              <details>
                <summary>Materials &amp; care</summary>
                <div className="acc-body">
                  <p style={{ marginBottom: 8 }}>{product.material}</p>
                  <ul>
                    {product.care.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </details>
              <details>
                <summary>Shipping &amp; returns</summary>
                <div className="acc-body">
                  <p>{product.shipping}</p>
                  <p style={{ marginTop: 8 }}>
                    <Link to="/shipping-returns" className="link-underline">
                      Full shipping &amp; returns policy
                    </Link>
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section container" aria-labelledby="related-title">
          <div className="section-head">
            <h2 id="related-title">Wear it with</h2>
          </div>
          <ProductGrid products={related} />
        </section>
      )}
      <RecentlyViewed excludeId={product.id} />

      <Dialog open={sizeGuide} onClose={() => setSizeGuide(false)} title="Size guide" wide>
        <SizeTables highlight={product.category} />
      </Dialog>
    </div>
  );
}
