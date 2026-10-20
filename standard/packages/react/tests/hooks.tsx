/// <reference types="vitest/globals" />
import React, { act, createRef } from 'react'
import { render } from '@testing-library/react'

/*
The internal hooks, from the built protected-api (planning/phase-5-render-hook-rollout.md)
*/

it('useRenderHookEl moves the element to a new elRef', async () => {
  const { useRenderHookEl } = await import('../dist/protected-api')
  const refA = createRef<HTMLElement>()
  const refB = createRef<HTMLElement>()

  function Area(props: { elRef: React.RefObject<HTMLElement> }) {
    const renderHookEl = useRenderHookEl({
      classGenerator: undefined,
      didMount: undefined,
      willUnmount: undefined,
      renderProps: {},
      elRef: props.elRef,
    })
    return <div ref={renderHookEl.ref} />
  }

  const { rerender, unmount } = render(<Area elRef={refA} />)
  const el = refA.current
  expect(el).toBeTruthy()

  rerender(<Area elRef={refB} />)
  expect(refA.current).toBe(null)
  expect(refB.current).toBe(el)

  unmount()
  expect(refB.current).toBe(null)
})

it('useReportedSize follows a change in which dimensions it watches', async () => {
  let deliver: (entries: unknown[]) => void
  const elements = new Set<Element>()

  vi.resetModules()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: typeof deliver) {
      deliver = callback
    }

    observe(el: Element) {
      elements.add(el)
    }

    unobserve(el: Element) {
      elements.delete(el)
    }
  })
  // jsdom has no layout, so every element would count as not rendered
  const getClientRects = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as any)

  try {
    // a fresh module, so it creates its observer with the mock
    const { useReportedSize } = await import('../dist/protected-api')
    let width: number | null | undefined
    let height: number | null | undefined
    const handleWidth = (value: number | null) => {
      width = value
    }
    const handleHeight = (value: number | null) => {
      height = value
    }

    function Measured(props: { dim: 'width' | 'height' }) {
      const elRef = useReportedSize({
        watchWidth: props.dim === 'width',
        watchHeight: props.dim === 'height',
        widthRef: handleWidth,
        heightRef: handleHeight,
      })
      return <div ref={elRef} />
    }

    function resizeAll(inlineSize: number, blockSize: number) {
      act(() => {
        deliver(Array.from(elements, (target) => ({
          target,
          borderBoxSize: [{ inlineSize, blockSize }],
        })))
      })
    }

    const { rerender, unmount } = render(<Measured dim="width" />)
    resizeAll(100, 50)
    expect(width).toBe(100)
    expect(height).toBe(undefined)

    rerender(<Measured dim="height" />)
    resizeAll(100, 60)
    expect(height).toBe(60)

    unmount()
  } finally {
    getClientRects.mockRestore()
    vi.unstubAllGlobals()
  }
})
