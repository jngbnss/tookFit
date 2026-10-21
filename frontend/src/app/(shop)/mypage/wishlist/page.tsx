"use client";

import { ProductGrid } from "@/components/ProductCard";
import { useWishlist } from "@/components/providers/Wishlist";
import { useAsync } from "@/hooks/useAsync";
import { wishlistApi } from "@/lib/api/me";

export default function WishlistPage() {
  const wishlist = useWishlist();
  // 하트를 눌러 빼면 목록에서도 바로 사라지게 개수가 바뀔 때 다시 불러온다
  const { data, loading, error } = useAsync(() => wishlistApi.list(), [wishlist.count]);

  return (
    <>
      <h1 className="page-title">위시리스트</h1>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 200 }} />}
      {data && (data.length ? <ProductGrid products={data} /> : <p className="empty">위시리스트가 비어 있어요. 마음에 드는 상품의 하트를 눌러보세요.</p>)}
    </>
  );
}
