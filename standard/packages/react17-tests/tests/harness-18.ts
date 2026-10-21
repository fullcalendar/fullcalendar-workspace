import type { ReactElement } from 'react'
import { act } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'

// React 18: a concurrent root (Strict Mode replays effects there)
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

export function createHarness(container: HTMLElement) {
  let root: Root | null = null

  return {
    render(el: ReactElement) {
      act(() => {
        root = root || createRoot(container)
        root.render(el)
      })
    },
    hydrate(el: ReactElement) {
      act(() => {
        root = hydrateRoot(container, el)
      })
    },
    unmount() {
      act(() => {
        root!.unmount()
        root = null
      })
    },
  }
}

export { act }
