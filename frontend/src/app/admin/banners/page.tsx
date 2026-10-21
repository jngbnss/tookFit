"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { useToast } from "@/components/providers/Toast";
import { useAsync } from "@/hooks/useAsync";
import { adminApi, uploadImage } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminBanner, BannerPosition, BannerRequest } from "@/lib/api/types";
import { isoToLocalInput, localInputToIso } from "@/lib/datetime-local";
import { asItems, formatDate } from "@/lib/format";

const POSITIONS: { value: BannerPosition; label: string; hint: string }[] = [
  { value: "MAIN_HERO", label: "메인 상단 큰 배너", hint: "가로 2400×1200px 권장, 모바일용은 1080×1350px" },
  { value: "MAIN_MIDDLE", label: "메인 중간 배너", hint: "16:9 비율 권장" },
  { value: "TOP_STRIP", label: "맨 위 한 줄 띠", hint: "이미지 없이 문구만 (예: 5만 원 이상 무료배송)" },
];

type Editing = BannerRequest & { id?: number; imageUrl?: string | null; mobileImageUrl?: string | null };

export default function AdminBannersPage() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.banners(), []);
  const [editing, setEditing] = useState<Editing | null>(null);
  const banners = asItems<AdminBanner>(data);

  const reorder = async (position: BannerPosition, id: number, d: number) => {
    const list = banners.filter((b) => b.position === position).sort((a, b) => a.sortOrder - b.sortOrder);
    const i = list.findIndex((b) => b.id === id);
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    try {
      await adminApi.reorderBanners(list.map((b) => b.id));
      reload();
    } catch (e) {
      notify(errorMessage(e), "error");
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>배너</h1>
        <button type="button" className="btn btn-sm" onClick={() => setEditing({ position: "MAIN_HERO", sortOrder: banners.length, active: true })}>
          배너 추가
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 160 }} />}
      {POSITIONS.map((pos) => {
        const list = banners.filter((b) => b.position === pos.value).sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <section key={pos.value} className="section" style={{ marginTop: 24 }}>
            <h2 className="panel-title">
              {pos.label} <span className="small muted">({pos.hint})</span>
            </h2>
            {list.length === 0 ? (
              <p className="small muted">등록된 배너가 없어요.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {list.map((b, i) => (
                      <tr key={b.id}>
                        <td style={{ width: 120 }}>{b.imageUrl ? <img src={b.imageUrl} alt="" style={{ width: 100, height: 56, objectFit: "cover" }} /> : <span className="muted">이미지 없음</span>}</td>
                        <td>
                          <strong>{b.title ?? "(제목 없음)"}</strong>
                          {b.subtitle && <span className="muted"> · {b.subtitle}</span>}
                          <br />
                          <span className="small muted">{b.linkUrl ?? "링크 없음"}</span>
                        </td>
                        <td>{b.startsAt || b.endsAt ? `${formatDate(b.startsAt)} ~ ${formatDate(b.endsAt)}` : "상시"}</td>
                        <td>{b.active ? "노출" : <span className="muted">숨김</span>}</td>
                        <td>
                          <div className="row">
                            <button type="button" onClick={() => reorder(pos.value, b.id, -1)} disabled={i === 0} aria-label="위로">
                              ↑
                            </button>
                            <button type="button" onClick={() => reorder(pos.value, b.id, 1)} disabled={i === list.length - 1} aria-label="아래로">
                              ↓
                            </button>
                            <button type="button" className="link" onClick={() => setEditing({ ...b })}>
                              수정
                            </button>
                            <button
                              type="button"
                              className="link accent"
                              onClick={async () => {
                                if (!confirm("배너를 삭제할까요?")) return;
                                try {
                                  await adminApi.deleteBanner(b.id);
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
          </section>
        );
      })}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "배너 수정" : "배너 추가"}>
        {editing && (
          <BannerForm
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

function BannerForm({ initial, onSaved }: { initial: Editing; onSaved: () => void }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Editing>(k: K, v: Editing[K]) => setF((x) => ({ ...x, [k]: v }));

  const upload = async (file: File | undefined, which: "image" | "mobile") => {
    if (!file) return;
    setError(null);
    try {
      const { storageKey, publicUrl } = await uploadImage(file, "banners");
      if (which === "image") setF((x) => ({ ...x, imageKey: storageKey, imageUrl: publicUrl }));
      else setF((x) => ({ ...x, mobileImageKey: storageKey, mobileImageUrl: publicUrl }));
    } catch (e) {
      setError(e instanceof Error && !("code" in e) ? e.message : errorMessage(e));
    }
  };

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (f.position === "TOP_STRIP" && !f.title?.trim()) return setError("띠 배너는 문구를 입력해주세요.");
        if (f.position !== "TOP_STRIP" && !f.imageKey) return setError("이미지를 올려주세요.");
        setBusy(true);
        setError(null);
        const body: BannerRequest = {
          position: f.position,
          title: f.title?.trim() || null,
          subtitle: f.subtitle?.trim() || null,
          imageKey: f.imageKey ?? null,
          mobileImageKey: f.mobileImageKey ?? null,
          linkUrl: f.linkUrl?.trim() || null,
          sortOrder: f.sortOrder,
          startsAt: f.startsAt ?? null,
          endsAt: f.endsAt ?? null,
          active: f.active,
        };
        try {
          if (f.id) await adminApi.updateBanner(f.id, body);
          else await adminApi.createBanner(body);
          onSaved();
        } catch (ex) {
          setError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>위치</span>
        <select className="select" value={f.position} onChange={(e) => set("position", e.target.value as BannerPosition)}>
          {POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>제목 (문구)</span>
        <input className="input" value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </label>
      {f.position !== "TOP_STRIP" && (
        <>
          <label className="field">
            <span>부제 (선택)</span>
            <input className="input" value={f.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
          </label>
          <div className="form-grid">
            <div className="field">
              <span className="label">이미지</span>
              {f.imageUrl && <img src={f.imageUrl} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />}
              <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "image")} />
            </div>
            <div className="field">
              <span className="label">모바일 이미지 (선택)</span>
              {f.mobileImageUrl && <img src={f.mobileImageUrl} alt="" style={{ width: "60%", aspectRatio: "4/5", objectFit: "cover" }} />}
              <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "mobile")} />
            </div>
          </div>
        </>
      )}
      <label className="field">
        <span>링크 (선택)</span>
        <input className="input" value={f.linkUrl ?? ""} onChange={(e) => set("linkUrl", e.target.value)} placeholder="/shop/new-arrivals" />
      </label>
      <div className="form-grid">
        <label className="field">
          <span>노출 시작 (선택)</span>
          <input className="input" type="datetime-local" value={isoToLocalInput(f.startsAt)} onChange={(e) => set("startsAt", localInputToIso(e.target.value))} />
        </label>
        <label className="field">
          <span>노출 종료 (선택)</span>
          <input className="input" type="datetime-local" value={isoToLocalInput(f.endsAt)} onChange={(e) => set("endsAt", localInputToIso(e.target.value))} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />
        노출
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn" disabled={busy}>
        저장
      </button>
    </form>
  );
}
