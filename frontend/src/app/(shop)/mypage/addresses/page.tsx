"use client";

import { useState } from "react";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressValue } from "@/components/AddressFields";
import { Dialog } from "@/components/Dialog";
import { useToast } from "@/components/providers/Toast";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/lib/api/client";
import { addressApi } from "@/lib/api/me";
import type { Address } from "@/lib/api/types";

type Editing = { id: number | null; label: string; value: AddressValue; isDefault: boolean };

export default function AddressesPage() {
  const { notify } = useToast();
  const { data, loading, error, reload } = useAsync(() => addressApi.list(), []);
  const [editing, setEditing] = useState<Editing | null>(null);

  const startEdit = (a?: Address) =>
    setEditing(
      a
        ? {
            id: a.id,
            label: a.label ?? "",
            isDefault: a.isDefault,
            value: { recipient: a.recipient, phone: a.phone, postalCode: a.postalCode, address1: a.address1, address2: a.address2 ?? "" },
          }
        : { id: null, label: "", isDefault: !data?.length, value: EMPTY_ADDRESS },
    );

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      notify(msg);
      await reload();
    } catch (e) {
      notify(errorMessage(e), "error");
    }
  };

  return (
    <div className="stack">
      <div className="row between">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          배송지
        </h1>
        <button type="button" className="btn btn-sm" onClick={() => startEdit()}>
          새 배송지
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="skeleton" style={{ height: 100 }} />}
      {data?.length === 0 && <p className="empty">저장된 배송지가 없어요.</p>}
      <ul className="stack-sm">
        {data?.map((a) => (
          <li key={a.id} className="address-card row between">
            <div>
              <strong>
                {a.label || a.recipient}
                {a.isDefault && <span className="muted small"> (기본)</span>}
              </strong>
              <p>
                {a.recipient} · {a.phone}
              </p>
              <p className="muted">
                ({a.postalCode}) {a.address1} {a.address2}
              </p>
            </div>
            <div className="row">
              {!a.isDefault && (
                <button type="button" className="link small" onClick={() => act(() => addressApi.update(a.id, { isDefault: true }), "기본 배송지로 정했어요.")}>
                  기본으로
                </button>
              )}
              <button type="button" className="link small" onClick={() => startEdit(a)}>
                수정
              </button>
              <button
                type="button"
                className="link small accent"
                onClick={() => {
                  if (confirm("이 배송지를 삭제할까요?")) act(() => addressApi.remove(a.id), "삭제했어요.");
                }}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "배송지 수정" : "새 배송지"}>
        {editing && <AddressEditor initial={editing} onSaved={() => {
              setEditing(null);
              reload();
            }} />}
      </Dialog>
    </div>
  );
}

function AddressEditor({ initial, onSaved }: { initial: Editing; onSaved: () => void }) {
  const { notify } = useToast();
  const [state, setState] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressValue, string>>>({});
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const errs = validateAddress(state.value);
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setBusy(true);
        const body = {
          label: state.label.trim() || null,
          recipient: state.value.recipient.trim(),
          phone: state.value.phone.trim(),
          postalCode: state.value.postalCode,
          address1: state.value.address1,
          address2: state.value.address2.trim() || null,
          isDefault: state.isDefault,
        };
        try {
          if (state.id) await addressApi.update(state.id, body);
          else await addressApi.create(body);
          notify("저장했어요.");
          onSaved();
        } catch (ex) {
          notify(errorMessage(ex), "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>배송지 이름 (선택)</span>
        <input className="input" placeholder="집, 회사" value={state.label} onChange={(e) => setState({ ...state, label: e.target.value })} />
      </label>
      <AddressFields value={state.value} onChange={(value) => setState({ ...state, value })} errors={errors} />
      <label className="check">
        <input type="checkbox" checked={state.isDefault} onChange={(e) => setState({ ...state, isDefault: e.target.checked })} />
        기본 배송지로 설정
      </label>
      <button className="btn" disabled={busy}>
        저장
      </button>
    </form>
  );
}
