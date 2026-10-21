"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductBasicForm } from "@/components/admin/product/ProductBasicForm";
import { useToast } from "@/components/providers/Toast";
import { adminApi } from "@/lib/api/admin";

export default function NewProductPage() {
  const router = useRouter();
  const { notify } = useToast();
  return (
    <>
      <div className="admin-head">
        <div>
          <p className="small muted">
            <Link href="/admin/products">상품</Link> / 새 상품
          </p>
          <h1>상품 등록</h1>
        </div>
      </div>
      <p className="small muted" style={{ marginBottom: 16 }}>
        기본 정보를 저장하면 색상, 사이즈·재고, 사진을 이어서 등록할 수 있어요. 처음에는 &lsquo;임시저장&rsquo; 상태로 만들어서 손님에게 보이지 않아요.
      </p>
      <ProductBasicForm
        submitLabel="저장하고 계속"
        onSubmit={async (body) => {
          const p = await adminApi.createProduct(body);
          notify("상품을 만들었어요. 색상과 옵션을 등록해주세요.");
          router.replace(`/admin/products/${p.id}`);
        }}
      />
    </>
  );
}
