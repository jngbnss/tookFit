"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/providers/Toast";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { NoticeRequest } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

export default function AdminNoticesPage() {
  const { notify } = useToast();
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useAsync(() => adminApi.notices({ page, size: 30 }), [page]);
  const [editing, setEditing] = useState<(NoticeRequest & { id?: number }) | null>(null);

  return (
    <>
      <div className="admin-head">
        <h1>공지</h1>
        <button type="button" className="btn btn-sm" onClick={() => setEditing({ title: "", body: "", pinned: false, published: true })}>
          공지 쓰기
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 160 }} />}
      {data && data.items.length === 0 && <p className="empty">공지가 없어요.</p>}
      {data && data.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>제목</th>
                <th>상태</th>
                <th>작성일</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((n) => (
                <tr key={n.id}>
                  <td>
                    {n.pinned && <strong className="accent">[고정] </strong>}
                    {n.title}
                  </td>
                  <td>{n.published ? "게시" : <span className="muted">비공개</span>}</td>
                  <td>{formatDate(n.createdAt)}</td>
                  <td>
                    <div className="row">
                      <button type="button" className="link" onClick={() => setEditing({ id: n.id, title: n.title, body: n.body, pinned: n.pinned, published: n.published })}>
                        수정
                      </button>
                      <button
                        type="button"
                        className="link accent"
                        onClick={async () => {
                          if (!confirm("공지를 삭제할까요?")) return;
                          try {
                            await adminApi.deleteNotice(n.id);
                            notify("삭제했어요.");
                            reload();
                          } catch (e) {
                            notify(errorMessage(e), "error");
                          }
                        }}
                      >
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
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "공지 수정" : "공지 쓰기"}>
        {editing && (
          <NoticeForm
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

function NoticeForm({ initial, onSaved }: { initial: NoticeRequest & { id?: number }; onSaved: () => void }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.title.trim() || !f.body.trim()) return setError("제목과 내용을 입력해주세요.");
        setBusy(true);
        setError(null);
        const body = { title: f.title.trim(), body: f.body, pinned: f.pinned, published: f.published };
        try {
          if (f.id) await adminApi.updateNotice(f.id, body);
          else await adminApi.createNotice(body);
          onSaved();
        } catch (ex) {
          setError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>제목</span>
        <input className="input" maxLength={200} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </label>
      <label className="field">
        <span>내용</span>
        <textarea className="textarea" style={{ minHeight: 220 }} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} />
        목록 맨 위에 고정
      </label>
      <label className="check">
        <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
        게시 (끄면 손님에게 보이지 않아요)
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn" disabled={busy}>
        저장
      </button>
    </form>
  );
}
