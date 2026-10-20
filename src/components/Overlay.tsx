import { useId, type ReactNode } from 'react';
import { CloseIcon } from './Icons';
import { useFocusTrap } from './useFocusTrap';

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children, wide = false }: BaseProps & { wide?: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className={`dialog ${wide ? 'dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
        <button type="button" className="icon-btn dialog-close" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
        <h2 id={id}>{title}</h2>
        {children}
      </div>
    </>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  footer,
}: BaseProps & { side?: 'left' | 'right'; footer?: ReactNode }) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className={`drawer drawer-${side}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
        <div className="drawer-head">
          <h2 id={id}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={`${title} 닫기`}>
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}
