import { Link } from 'react-router-dom';
import { usePageMeta } from '../components/usePageMeta';

export default function NotFound() {
  usePageMeta('페이지를 찾을 수 없습니다');
  return (
    <div className="container">
      <div className="empty" style={{ minHeight: '50vh', alignContent: 'center' }}>
        <p className="eyebrow">404</p>
        <h1 className="page-title">페이지를 찾을 수 없습니다.</h1>
        <p className="muted">링크가 만료되었거나 더 이상 판매하지 않는 상품일 수 있습니다.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            홈으로
          </Link>
          <Link to="/shop/all" className="btn btn-secondary">
            전체 상품 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
