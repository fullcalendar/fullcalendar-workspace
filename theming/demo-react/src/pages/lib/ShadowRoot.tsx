import { CSSProperties, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ShadowRootProps {
  style?: CSSProperties
  children: ReactNode
}

export function ShadowRoot({ style, children }: ShadowRootProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)

  useLayoutEffect(() => { // executes sooner than useEffect
    const host = hostRef.current
    if (!host) return

    // If a shadow root already exists (e.g. StrictMode, hot reload),
    // reuse it instead of calling attachShadow again.
    const existing = host.shadowRoot
    if (existing) {
      setShadowRoot(existing as unknown as ShadowRoot)
      return
    }

    const sr = host.attachShadow({ mode: 'open' })

    setShadowRoot(sr as unknown as ShadowRoot)
  }, []);

  return (
    <div ref={hostRef} style={style}>
      {shadowRoot
        ? createPortal(children, shadowRoot as unknown as Element)
        : null}
    </div>
  );
}
