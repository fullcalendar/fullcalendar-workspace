import { CSSProperties, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ShadowRootProps {
  className?: string
  style?: CSSProperties
  cssText?: string
  children: ReactNode
}

export function ShadowRoot({ className, style, cssText, children }: ShadowRootProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)

  useLayoutEffect(() => { // executes sooner than useEffect
    const host = hostRef.current;
    if (!host) return;

    let sr = host.shadowRoot as ShadowRoot | null;
    if (!sr) {
      sr = host.attachShadow({ mode: 'open' }) as ShadowRoot;
    }

    if (cssText && !sr.querySelector('style[data-shadow-style]')) {
      const styleEl = document.createElement('style');
      styleEl.textContent = cssText;
      styleEl.setAttribute('data-shadow-style', '');
      sr.appendChild(styleEl);
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
