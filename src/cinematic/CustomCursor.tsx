import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { prefersReducedMotion } from './flyToCart';

const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, label, [data-cursor]';

/** Desktop-only ring cursor that grows over interactive elements. Never intercepts pointer events. */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<'default' | 'link' | 'drag' | 'view'>('default');
  const [label, setLabel] = useState('');
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    if (!fine || prefersReducedMotion()) return;
    setEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = (e.target as Element | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
      const cursor = el?.dataset.cursor;
      setVariant(cursor === 'drag' ? 'drag' : cursor === 'view' ? 'view' : el ? 'link' : 'default');
      setLabel(el?.dataset.cursorLabel ?? '');
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [x, y]);

  if (!enabled) return null;
  const size = variant === 'default' ? 14 : variant === 'link' ? 40 : 84;
  return (
    <motion.div className={`cursor cursor-${variant}`} style={{ x: sx, y: sy }} aria-hidden="true">
      <motion.div className="cursor-ring" animate={{ width: size, height: size }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
        {(variant === 'drag' || variant === 'view') && <span>{label || (variant === 'drag' ? 'DRAG' : 'VIEW')}</span>}
      </motion.div>
    </motion.div>
  );
}
