import { useState } from 'react';
import { FALLBACK_IMAGE } from '../data/products';
import { asset } from '../lib/format';

interface Props {
  src: string;
  alt: string;
  eager?: boolean;
  className?: string;
  imgClassName?: string;
}

/** 4:5 image with a loading skeleton and a deterministic fallback on error. */
export function SmartImage({ src, alt, eager = false, className = '', imgClassName = '' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={`img-frame ${loaded ? '' : 'loading'} ${className}`}>
      <img
        key={src}
        className={imgClassName}
        src={asset(failed ? FALLBACK_IMAGE : src)}
        alt={failed ? `${alt} (이미지를 불러올 수 없음)` : alt}
        width={1024}
        height={1280}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true);
          else setLoaded(true);
        }}
      />
    </div>
  );
}
