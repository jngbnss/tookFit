import { Component, lazy, Suspense, type ReactNode } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StoreProvider } from './state/store';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import Landing from './pages/Landing';
import { MoodProvider } from './cinematic/MoodContext';
import { DragToCartProvider } from './cinematic/DragToCart';
import { CustomCursor } from './cinematic/CustomCursor';

const Catalog = lazy(() => import('./pages/Catalog'));
const Explore = lazy(() => import('./pages/Explore'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const NotFound = lazy(() => import('./pages/NotFound'));
const OrderConfirmation = lazy(() => import('./pages/Orders').then((m) => ({ default: m.OrderConfirmation })));
const OrderHistory = lazy(() => import('./pages/Orders').then((m) => ({ default: m.OrderHistory })));
const OrderDetail = lazy(() => import('./pages/Orders').then((m) => ({ default: m.OrderDetail })));
const AuthPage = lazy(() => import('./pages/Account').then((m) => ({ default: m.AuthPage })));
const AccountDashboard = lazy(() => import('./pages/Account').then((m) => ({ default: m.AccountDashboard })));
const info = (name: 'About' | 'ShippingReturns' | 'SizeGuide' | 'Contact' | 'FAQ' | 'Privacy' | 'Terms') =>
  lazy(() => import('./pages/Info').then((m) => ({ default: m[name] })));
const About = info('About');
const ShippingReturns = info('ShippingReturns');
const SizeGuide = info('SizeGuide');
const Contact = info('Contact');
const FAQ = info('FAQ');
const Privacy = info('Privacy');
const Terms = info('Terms');

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="container">
          <div className="empty" role="alert">
            <h1 className="page-title">문제가 발생했습니다.</h1>
            <p className="muted">페이지를 새로고침해 주세요. 장바구니와 위시리스트는 저장되어 있습니다.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                새로고침
              </button>
              <Link to="/" className="btn btn-secondary" onClick={() => this.setState({ error: false })}>
                홈으로
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <div className="spinner" />
      <span className="sr-only">페이지 불러오는 중…</span>
    </div>
  );
}

/** Soft cinematic fade/rise between routes. New pages render immediately (no exit wait) so navigation never stalls. */
function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  return (
    <motion.div key={pathname} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

export function AppRoutes() {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <PageTransition>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/shop" element={<Catalog />} />
            <Route path="/shop/:collection" element={<Catalog />} />
            <Route path="/search" element={<Catalog search />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderConfirmation />} />
            <Route path="/account" element={<AccountDashboard />} />
            <Route path="/account/sign-in" element={<AuthPage mode="sign-in" />} />
            <Route path="/account/register" element={<AuthPage mode="register" />} />
            <Route path="/account/forgot-password" element={<AuthPage mode="forgot" />} />
            <Route path="/account/orders" element={<OrderHistory />} />
            <Route path="/account/orders/:id" element={<OrderDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/shipping-returns" element={<ShippingReturns />} />
            <Route path="/size-guide" element={<SizeGuide />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </PageTransition>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MoodProvider>
        <DragToCartProvider>
          <AppRoutes />
          <CustomCursor />
        </DragToCartProvider>
      </MoodProvider>
    </StoreProvider>
  );
}
