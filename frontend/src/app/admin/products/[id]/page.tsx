"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ColorEditor } from "@/components/admin/product/ColorEditor";
import { ImageEditor } from "@/components/admin/product/ImageEditor";
import { ProductBasicForm } from "@/components/admin/product/ProductBasicForm";
import { VariantGrid } from "@/components/admin/product/VariantGrid";
import { useToast } from "@/components/providers/Toast";
import { StatusBadge } from "@/components/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminProductDetail } from "@/lib/api/types";
import { PRODUCT_STATUS_LABEL } from "@/lib/format";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const { notify } = useToast();
  const { data: product, error, loading, setData } = useAsync(() => adminApi.product(productId), [productId]);

  if (error) return <p className="form-error">{error}</p>;
  if (loading || !product) return <div className="skeleton" style={{ height: 320 }} />;

  const update = (p: AdminProductDetail, msg: string) => {
    setData(p);
    notify(msg);
  };

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="admin-head">
        <div>
          <p className="small muted">
            <Link href="/admin/products">상품</Link> / {product.name}
          </p>
          <h1>
            {product.name} <StatusBadge status={product.status} label={PRODUCT_STATUS_LABEL[product.status]} />
          </h1>
        </div>
        <div className="row">
          {product.status === "ACTIVE" && (
            <Link className="btn btn-sm btn-ghost" href={`/products/${product.slug}`} target="_blank">
              쇼핑몰에서 보기
            </Link>
          )}
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={async () => {
              if (!confirm("상품을 삭제할까요? 주문 기록이 있는 상품은 삭제 대신 숨김 처리돼요.")) return;
              try {
                await adminApi.deleteProduct(product.id);
                notify("삭제(또는 숨김) 처리했어요.");
                router.replace("/admin/products");
              } catch (e) {
                notify(errorMessage(e), "error");
              }
            }}
          >
            삭제
          </button>
        </div>
      </div>

      {product.status !== "ACTIVE" && (
        <p className="small muted">
          지금은 손님에게 보이지 않아요. 색상, 옵션·재고, 사진을 모두 등록한 뒤 상태를 &lsquo;판매중&rsquo;으로 바꿔주세요.
        </p>
      )}

      <section>
        <h2 className="panel-title">기본 정보</h2>
        <ProductBasicForm
          key={product.id}
          initial={{
            slug: product.slug,
            name: product.name,
            categoryId: product.categoryId,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice,
            badge: product.badge,
            material: product.material,
            fit: product.fit,
            care: product.care,
            status: product.status,
            featuredRank: product.featuredRank,
          }}
          onSubmit={async (body) => update(await adminApi.updateProduct(product.id, body), "기본 정보를 저장했어요.")}
        />
      </section>

      <section>
        <h2 className="panel-title">색상</h2>
        <ColorEditor key={product.colors.map((c) => c.id).join(",")} product={product} onSaved={(p) => update(p, "색상을 저장했어요.")} />
      </section>

      <section>
        <h2 className="panel-title">사이즈·재고</h2>
        <VariantGrid key={`${product.colors.map((c) => c.id).join(",")}/${product.variants.map((v) => v.id).join(",")}`} product={product} onSaved={(p) => update(p, "옵션과 재고를 저장했어요.")} />
      </section>

      <section>
        <h2 className="panel-title">사진</h2>
        <ImageEditor key={product.images.map((i) => i.id).join(",")} product={product} onSaved={(p) => update(p, "사진을 저장했어요.")} />
      </section>
    </div>
  );
}
