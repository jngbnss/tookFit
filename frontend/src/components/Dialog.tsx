"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

/** 네이티브 <dialog> 기반 모달. 포커스 가두기와 Esc 닫기를 브라우저가 처리한다. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal?.();
    if (!open && el.open) el.close?.();
  }, [open]);

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-label={title}>
      <div className="dialog-head">
        <h2 style={{ fontSize: 16 }}>{title}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      </div>
      <div className="dialog-body">{open && children}</div>
    </dialog>
  );
}
