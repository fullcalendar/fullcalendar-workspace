import { CSSProperties, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ShadowRootProps {
  className?: string
  style?: CSSProperties
  cssUrl?: string
  children: ReactNode
}

export function ShadowRoot({ className, style, cssUrl, children }: ShadowRootProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)

  useLayoutEffect(() => { // executes sooner than useEffect
    const host = hostRef.current;
    if (!host) return;

    let sr = host.shadowRoot as ShadowRoot | null;
    if (!sr) {
      sr = host.attachShadow({ mode: 'open' }) as ShadowRoot;
    }

    if (cssUrl && !sr.querySelector('link[data-shadow-style="island"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      link.setAttribute('data-shadow-style', 'island');
      sr.appendChild(link);
    }

    setShadowRoot(sr);
  }, []);

  return (
    <div ref={hostRef} className={className} style={style}>
      {shadowRoot
        ? createPortal(children, shadowRoot as unknown as Element)
        : null}
    </div>
  );
}
