import { Link } from 'react-router-dom';
import { usePageMeta } from '../components/usePageMeta';

export default function NotFound() {
  usePageMeta('Page not found');
  return (
    <div className="container">
      <div className="empty" style={{ minHeight: '50vh', alignContent: 'center' }}>
        <p className="eyebrow">404</p>
        <h1 className="page-title">We couldn’t find that page.</h1>
        <p className="muted">The link may be out of date, or the item may no longer be available.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            Go to home
          </Link>
          <Link to="/shop/all" className="btn btn-secondary">
            Shop all products
          </Link>
        </div>
      </div>
    </div>
  );
}
