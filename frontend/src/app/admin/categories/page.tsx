"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { useToast } from "@/components/providers/Toast";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminCategory, AdminCategoryRequest } from "@/lib/api/types";

export default function AdminCategoriesPage() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.categories(), []);
  const [editing, setEditing] = useState<(AdminCategoryRequest & { id?: number }) | null>(null);

  const remove = async (c: AdminCategory) => {
    if (!confirm(`'${c.name}' 카테고리를 삭제할까요?`)) return;
    try {
      await adminApi.deleteCategory(c.id);
      notify("삭제했어요.");
      reload();
    } catch (e) {
      notify(errorMessage(e), "error");
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>카테고리</h1>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setEditing({ slug: "", name: "", sortOrder: (data?.length ?? 0) + 1, visible: true })}
        >
          카테고리 추가
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 160 }} />}
      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="num">순서</th>
                <th>이름</th>
                <th>slug</th>
                <th>노출</th>
                <th className="num">상품 수</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="num">{c.sortOrder}</td>
                  <td>{c.name}</td>
                  <td className="muted">{c.slug}</td>
                  <td>{c.visible ? "노출" : <span className="accent">숨김</span>}</td>
                  <td className="num">{c.productCount}</td>
                  <td>
                    <div className="row">
                      <button type="button" className="link" onClick={() => setEditing({ id: c.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder, visible: c.visible })}>
                        수정
                      </button>
                      <button type="button" className="link accent" disabled={c.productCount > 0} title={c.productCount > 0 ? "상품이 있는 카테고리는 삭제할 수 없어요" : undefined} onClick={() => remove(c)}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "카테고리 수정" : "카테고리 추가"}>
        {editing && (
          <CategoryForm
            initial={editing}
            onSaved={() => {
              setEditing(null);
              notify("저장했어요.");
              reload();
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function CategoryForm({ initial, onSaved }: { initial: AdminCategoryRequest & { id?: number }; onSaved: () => void }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return setError("이름을 입력해주세요.");
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError("slug는 영문 소문자, 숫자, 하이픈만 쓸 수 있어요.");
        setBusy(true);
        setError(null);
        const body = { slug: form.slug, name: form.name.trim(), sortOrder: form.sortOrder, visible: form.visible };
        try {
          if (form.id) await adminApi.updateCategory(form.id, body);
          else await adminApi.createCategory(body);
          onSaved();
        } catch (ex) {
          setError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>이름</span>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="아우터" />
      </label>
      <label className="field">
        <span>slug (URL)</span>
        <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="outerwear" />
      </label>
      <label className="field">
        <span>순서</span>
        <input className="input" inputMode="numeric" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
        쇼핑몰 메뉴에 노출
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn" disabled={busy}>
        저장
      </button>
    </form>
  );
}
