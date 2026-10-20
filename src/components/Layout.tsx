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
import { AnnouncementBar, PromoPopup } from './PromoPopup';

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
      <div ref={ref} className="search-panel" role="dialog" aria-modal="true" aria-label="상품 검색">
        <div className="container">
          <form className="search-form" role="search" onSubmit={submit}>
            <label htmlFor={`${id}-q`} className="sr-only">
              상품 검색
            </label>
            <input
              id={`${id}-q`}
              data-autofocus
              className="input"
              type="search"
              placeholder="코트, 니트, 데님 검색…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              aria-describedby={`${id}-hint`}
            />
            <button type="submit" className="btn btn-primary">
              검색
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="검색 닫기">
              <CloseIcon />
            </button>
          </form>
          <p id={`${id}-hint`} className="sr-only">
            입력하면 추천 상품이 표시됩니다.
          </p>
          <div className="search-results">
            {suggestions.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  추천 상품
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
            {q.trim().length >= 2 && suggestions.length === 0 && <p className="muted">일치하는 상품이 없습니다. “울”, “니트”, “부츠”로 검색해 보세요.</p>}
            {searches.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  최근 검색어
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
                  최근 검색어 삭제
                </button>
              </div>
            )}
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                인기 검색어
              </p>
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['코트', '케이블 니트', '와이드', '부츠'].map((s) => (
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
      title={`장바구니 (${totals.itemCount})`}
      footer={
        cart.length > 0 ? (
          <>
            <FreeShippingProgress subtotal={totals.subtotal} />
            <div className="summary-row summary-total" style={{ borderTop: 0, paddingTop: 0 }}>
              <span>상품 금액</span>
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
              주문하기
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => {
                close();
                navigate('/cart');
              }}
            >
              장바구니 보기
            </button>
          </>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <div className="empty" style={{ padding: '48px 0' }}>
          <p>장바구니가 비어 있습니다.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              close();
              navigate('/shop/new-arrivals');
            }}
          >
            신상품 보러가기
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
    <Drawer open={open} onClose={onClose} title="메뉴" side="left">
      <nav className="mobile-nav" aria-label="모바일 메뉴">
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
              위시리스트
            </Link>
          </li>
          <li>
            <Link to={user ? '/account' : '/account/sign-in'} onClick={onClose}>
              {user ? '마이페이지' : '로그인'}
            </Link>
          </li>
          <li>
            <Link to="/account/orders" onClick={onClose}>
              주문 내역
            </Link>
          </li>
          <li>
            <Link to="/about" onClick={onClose}>
              TUK FIT 소개
            </Link>
          </li>
          <li>
            <Link to="/contact" onClick={onClose}>
              고객센터
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
          <button type="button" className="icon-btn menu-btn" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </button>
          <button type="button" className="icon-btn" aria-label="검색 열기" aria-expanded={searchOpen} onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </button>
        </div>
        <Link to="/" className="wordmark" aria-label="TUK FIT 홈">
          TUK FIT
        </Link>
        <div className="header-right">
          <Link to={user ? '/account' : '/account/sign-in'} className="icon-btn hide-mobile" aria-label={user ? `${user.name}님의 마이페이지` : '로그인'}>
            <UserIcon />
          </Link>
          <Link to="/wishlist" className="icon-btn" aria-label={`위시리스트, ${wishlist.length}개`}>
            <HeartIcon />
            {wishlist.length > 0 && <span className="count-badge" aria-hidden="true">{wishlist.length}</span>}
          </Link>
          <button type="button" className="icon-btn" aria-label={`장바구니 열기, ${totals.itemCount}개`} onClick={() => setCartOpen(true)}>
            <BagIcon />
            {totals.itemCount > 0 && <span className="count-badge" aria-hidden="true">{totals.itemCount}</span>}
          </button>
        </div>
      </div>
      <nav className="nav" aria-label="주 메뉴">
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
              TUK FIT
            </span>
            <p className="muted" style={{ maxWidth: 320 }}>
              추운 도시를 위한 조용한 남성복. 서울에서 디자인하고 소량 생산합니다.
            </p>
            <p className="muted" style={{ fontSize: 12, maxWidth: 340 }}>
              프론트엔드 데모 스토어입니다. 실제 주문, 결제, 계정은 처리되지 않습니다.
            </p>
          </div>
          <div>
            <h3>쇼핑</h3>
            <ul>
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop/${c.slug}`}>{c.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/shop/sale">세일</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>고객 지원</h3>
            <ul>
              <li>
                <Link to="/shipping-returns">배송 및 반품</Link>
              </li>
              <li>
                <Link to="/size-guide">사이즈 가이드</Link>
              </li>
              <li>
                <Link to="/faq">자주 묻는 질문</Link>
              </li>
              <li>
                <Link to="/contact">고객센터</Link>
              </li>
              <li>
                <Link to="/account/orders">주문 내역</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>브랜드</h3>
            <ul>
              <li>
                <Link to="/about">브랜드 소개</Link>
              </li>
              <li>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                  인스타그램 <span className="sr-only">(새 탭에서 열림)</span>
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">
                  유튜브 <span className="sr-only">(새 탭에서 열림)</span>
                </a>
              </li>
              <li>
                <a href="https://www.pinterest.com/" target="_blank" rel="noopener noreferrer">
                  핀터레스트 <span className="sr-only">(새 탭에서 열림)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 TUK FIT. 데모 스토어.</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <Link to="/privacy">개인정보처리방침</Link>
            <Link to="/terms">이용약관</Link>
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
            <button type="button" aria-label="알림 닫기" onClick={() => dismissToast(t.id)} style={{ width: 28, height: 28 }}>
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
        본문 바로가기
      </a>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <Footer />
      <Toasts />
      <PromoPopup />
    </>
  );
}
