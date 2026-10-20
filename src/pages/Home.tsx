import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { inCollection, sortProducts } from '../lib/catalog';
import { asset } from '../lib/format';
import { isEmail } from '../lib/validation';
import { track } from '../lib/analytics';
import { ProductGrid } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { usePageMeta } from '../components/usePageMeta';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setDone(true);
    track('newsletter_signup');
  }

  return (
    <section className="newsletter" aria-labelledby="nl-title">
      <div className="container newsletter-inner">
        <div>
          <p className="eyebrow">Newsletter</p>
          <h2 id="nl-title">Early access to new drops and private sales.</h2>
        </div>
        {done ? (
          <p className="notice notice-success" role="status">
            Thank you — you’re on the list. (Demo: no email was sent or stored.)
          </p>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor="nl-email" className="sr-only">
              Email address
            </label>
            <div className="row">
              <input
                id="nl-email"
                className="input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'nl-err' : 'nl-note'}
              />
              <button type="submit" className="btn btn-light">
                Subscribe
              </button>
            </div>
            {error ? (
              <p id="nl-err" className="error-text" role="alert">
                {error}
              </p>
            ) : (
              <p id="nl-note" style={{ fontSize: 12, color: '#b9b6ae' }}>
                Use a sample address. Unsubscribe anytime.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta('', 'Shop the T.O.O.K FIT fall/winter collection: wool overcoats, heavy knitwear, wide trousers, and boots designed in Seoul.');
  const newArrivals = sortProducts(PRODUCTS.filter((p) => inCollection(p, 'new-arrivals')), 'newest').slice(0, 4);
  const best = PRODUCTS.filter((p) => p.badge === 'BEST').slice(0, 4);
  const catImages = Object.fromEntries(CATEGORIES.map((c) => [c.slug, PRODUCTS.find((p) => p.category === c.slug)!]));

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <picture>
          <source media="(max-width: 767px)" srcSet={asset('images/editorial/hero-mobile-01.webp')} />
          <img
            src={asset('images/editorial/hero-01.webp')}
            alt="Fall/winter studio still life: a black wool overcoat, cream cable-knit sweater, charcoal wide trousers, a camel scarf, and black Chelsea boots against a warm stone wall"
            width={2000}
            height={1125}
            fetchPriority="high"
          />
        </picture>
        <div className="hero-copy">
          <p className="eyebrow">Fall / Winter 2026</p>
          <h1 id="hero-title">Built for the cold, cut for the city.</h1>
          <p>Long wool coats, honest knitwear, and wide trousers in black, charcoal, and cream.</p>
          <Link to="/shop/all" className="btn btn-primary">
            Shop the collection
          </Link>
        </div>
      </section>

      <section className="section container" aria-labelledby="new-title">
        <div className="section-head">
          <h2 id="new-title">New Arrivals</h2>
          <Link to="/shop/new-arrivals" className="link-underline">
            View all
          </Link>
        </div>
        <ProductGrid products={newArrivals} />
      </section>

      <section className="banner" aria-labelledby="ed-title">
        <img src={asset('images/editorial/editorial-02.webp')} alt="Charcoal technical parka, cream mock-neck knit, brown corduroy pants, and an olive beanie arranged in a minimal studio" loading="lazy" width={2000} height={1000} />
        <div className="banner-copy">
          <p className="eyebrow">The layering edit</p>
          <h2 id="ed-title">Three layers, one quiet palette.</h2>
          <p className="muted">A technical shell over fine merino and heavy corduroy — warm without the bulk.</p>
          <Link to="/shop/outerwear" className="btn btn-secondary">
            Shop outerwear
          </Link>
        </div>
      </section>

      <section className="section container" aria-labelledby="best-title">
        <div className="section-head">
          <h2 id="best-title">Best Sellers</h2>
          <Link to="/shop/best-sellers" className="link-underline">
            View all
          </Link>
        </div>
        <ProductGrid products={best} />
      </section>

      <section className="section container" aria-labelledby="cat-title" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2 id="cat-title">Shop by Category</h2>
        </div>
        <ul className="cat-grid">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link to={`/shop/${c.slug}`} className="cat-tile">
                <SmartImage src={catImages[c.slug].images[0].src} alt="" />
                <span>{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section container" aria-label="About T.O.O.K FIT">
        <div className="statement">
          <p className="eyebrow">T.O.O.K FIT</p>
          <p className="display">“Take only what you’ll keep.” Fewer pieces, better fabric, and shapes that stay right season after season.</p>
          <Link to="/about" className="link-underline">
            Our approach
          </Link>
        </div>
      </section>

      <RecentlyViewed />
      <Newsletter />
    </>
  );
}
