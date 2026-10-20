import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CATEGORIES, COLLECTIONS } from '../data/products';
import { searchSuggestions } from '../lib/catalog';
import { asset, formatKRW } from '../lib/format';
import { useStore } from '../state/store';
import { CartLine, FreeShippingProgress } from './CartParts';
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import { Drawer } from './Overlay';
import { useFocusTrap } from './useFocusTrap';

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { searches, addSearch, clearSearches } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const ref = useFocusTrap<HTMLDivElement>(true, onClose);
  const suggestions = searchSuggestions(q);
  const id = useId();

  function go(term: string) {
    const t = term.trim();
    if (!t) return;
    addSearch(t);
    onClose();
    navigate(`/search?q=${encodeURIComponent(t)}`);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="search-panel" role="dialog" aria-modal="true" aria-label="Search products">
        <div className="container">
          <form className="search-form" role="search" onSubmit={submit}>
            <label htmlFor={`${id}-q`} className="sr-only">
              Search products
            </label>
            <input
              id={`${id}-q`}
              data-autofocus
              className="input"
              type="search"
              placeholder="Search coats, knitwear, denim…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              aria-describedby={`${id}-hint`}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search">
              <CloseIcon />
            </button>
          </form>
          <p id={`${id}-hint`} className="sr-only">
            Suggestions appear as you type.
          </p>
          <div className="search-results">
            {suggestions.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Suggestions
                </p>
                <ul aria-live="polite">
                  {suggestions.map((p) => (
                    <li key={p.id}>
                      <Link
                        className="suggestion"
                        to={`/product/${p.slug}`}
                        onClick={() => {
                          addSearch(q);
                          onClose();
                        }}
                      >
                        <img src={asset(p.images[0].src)} alt="" width={48} height={60} />
                        <span>
                          {p.name}
                          <br />
                          <span className="muted">{formatKRW(p.price)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {q.trim().length >= 2 && suggestions.length === 0 && <p className="muted">No matching products. Try “wool”, “knit”, or “boots”.</p>}
            {searches.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Recent searches
                </p>
                <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {searches.map((s) => (
                    <li key={s}>
                      <button type="button" className="chip" onClick={() => go(s)}>
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn-text" onClick={clearSearches}>
                  Clear recent searches
                </button>
              </div>
            )}
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                Popular
              </p>
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Overcoat', 'Cable knit', 'Wide trousers', 'Boots'].map((s) => (
                  <li key={s}>
                    <button type="button" className="chip" onClick={() => go(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CartDrawer() {
  const { cart, totals, cartOpen, setCartOpen } = useStore();
  const navigate = useNavigate();
  const close = () => setCartOpen(false);
  return (
    <Drawer
      open={cartOpen}
      onClose={close}
      title={`Your bag (${totals.itemCount})`}
      footer={
        cart.length > 0 ? (
          <>
            <FreeShippingProgress subtotal={totals.subtotal} />
            <div className="summary-row summary-total" style={{ borderTop: 0, paddingTop: 0 }}>
              <span>Subtotal</span>
              <span>{formatKRW(totals.subtotal)}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                close();
                navigate('/checkout');
              }}
            >
              Checkout
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => {
                close();
                navigate('/cart');
              }}
            >
              View bag
            </button>
          </>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <div className="empty" style={{ padding: '48px 0' }}>
          <p>Your bag is empty.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              close();
              navigate('/shop/new-arrivals');
            }}
          >
            Shop new arrivals
          </button>
        </div>
      ) : (
        <ul>
          {cart.map((item) => (
            <CartLine key={item.key} item={item} compact onNavigate={close} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useStore();
  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left">
      <nav className="mobile-nav" aria-label="Mobile">
        <ul>
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <Link to={`/shop/${c.slug}`} onClick={onClose} style={c.slug === 'sale' ? { color: 'var(--accent)' } : undefined}>
                {c.label}
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/wishlist" onClick={onClose}>
              Wishlist
            </Link>
          </li>
          <li>
            <Link to={user ? '/account' : '/account/sign-in'} onClick={onClose}>
              {user ? 'My account' : 'Sign in'}
            </Link>
          </li>
          <li>
            <Link to="/account/orders" onClick={onClose}>
              Orders
            </Link>
          </li>
          <li>
            <Link to="/about" onClick={onClose}>
              About T.O.O.K FIT
            </Link>
          </li>
          <li>
            <Link to="/contact" onClick={onClose}>
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </Drawer>
  );
}

function Header() {
  const { totals, wishlist, user, setCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="header-left">
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </button>
          <button type="button" className="icon-btn" aria-label="Open search" aria-expanded={searchOpen} onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </button>
        </div>
        <Link to="/" className="wordmark" aria-label="T.O.O.K FIT home">
          T.O.O.K FIT
        </Link>
        <div className="header-right">
          <Link to={user ? '/account' : '/account/sign-in'} className="icon-btn hide-mobile" aria-label={user ? `Account for ${user.name}` : 'Sign in'}>
            <UserIcon />
          </Link>
          <Link to="/wishlist" className="icon-btn" aria-label={`Wishlist, ${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'}`}>
            <HeartIcon />
            {wishlist.length > 0 && <span className="count-badge" aria-hidden="true">{wishlist.length}</span>}
          </Link>
          <button type="button" className="icon-btn" aria-label={`Open bag, ${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}`} onClick={() => setCartOpen(true)}>
            <BagIcon />
            {totals.itemCount > 0 && <span className="count-badge" aria-hidden="true">{totals.itemCount}</span>}
          </button>
        </div>
      </div>
      <nav className="nav" aria-label="Primary">
        <ul className="container">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <NavLink to={`/shop/${c.slug}`} className={c.slug === 'sale' ? 'sale-link' : undefined}>
                {c.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CartDrawer />
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="stack" style={{ gap: 12 }}>
            <span className="wordmark" style={{ fontSize: 22 }}>
              T.O.O.K FIT
            </span>
            <p className="muted" style={{ maxWidth: 320 }}>
              Quiet menswear for cold cities. Designed in Seoul, made in small runs.
            </p>
            <p className="muted" style={{ fontSize: 12, maxWidth: 340 }}>
              This is a frontend demonstration store. No real orders, payments, or accounts are processed.
            </p>
          </div>
          <div>
            <h3>Shop</h3>
            <ul>
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop/${c.slug}`}>{c.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/shop/sale">Sale</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Help</h3>
            <ul>
              <li>
                <Link to="/shipping-returns">Shipping &amp; Returns</Link>
              </li>
              <li>
                <Link to="/size-guide">Size Guide</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/account/orders">Order history</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                  Instagram <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">
                  YouTube <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a href="https://www.pinterest.com/" target="_blank" rel="noopener noreferrer">
                  Pinterest <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 T.O.O.K FIT. Demo store.</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span>{t.message}</span>
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {t.action && (
              <Link to={t.action.to} onClick={() => dismissToast(t.id)}>
                {t.action.label}
              </Link>
            )}
            <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)} style={{ width: 28, height: 28 }}>
              ×
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);
  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <ScrollToTop />
      <div className="announcement">
        Free shipping over ₩100,000 · Use code TOOK10 for 10% off · <Link to="/shipping-returns">Free 14-day returns</Link>
      </div>
      <Header />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <Footer />
      <Toasts />
    </>
  );
}
