import { describe, expect, it } from 'vitest'
import { computeEdges, computeInnerRect } from 'fullcalendar/protected-api'
import { appendTestElement } from '../lib/calendar'

/*
Internal DOM geometry used for drag auto-scrolling (ElementScrollGeomCache): an element's borders
and padding, and the rect inside them.

Scrollbars aren't covered: headless Chromium runs with hidden scrollbars (Playwright's
--hide-scrollbars), which take no space even when styled, so their thickness is always 0 here.
*/

function createBox(css: Partial<CSSStyleDeclaration>, innerWidth = 100, innerHeight = 100): HTMLElement {
  const el = appendTestElement(document.createElement('div'))
  Object.assign(el.style, { position: 'absolute', top: '0', left: '0', overflow: 'hidden' }, css)
  const innerEl = el.appendChild(document.createElement('div'))
  Object.assign(innerEl.style, { position: 'relative', width: innerWidth + 'px', height: innerHeight + 'px' })
  return el
}

describe('computeEdges', () => {
  it.each([
    ['margin', { margin: '5px 10px' }, 0, 0],
    ['padding', { padding: '5px 10px' }, 0, [5, 10]],
    ['border', { border: '5px solid red' }, 5, 0],
    ['border and padding', { border: '5px solid red', padding: '5px 10px' }, 5, [5, 10]],
  ] as const)('with %s', (_desc, css, borderWidth, padding) => {
    const [paddingY, paddingX] = padding === 0 ? [0, 0] : padding

    for (const direction of ['ltr', 'rtl']) {
      const el = createBox({ ...css, direction })

      expect({ direction, ...computeEdges(el, true) }).toEqual({
        direction,
        borderLeft: borderWidth,
        borderRight: borderWidth,
        borderTop: borderWidth,
        borderBottom: borderWidth,
        scrollbarLeft: 0,
        scrollbarRight: 0,
        scrollbarBottom: 0,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop: paddingY,
        paddingBottom: paddingY,
      })
    }
  })
})

describe('computeInnerRect', () => {
  const INNER_WIDTH = 150
  const INNER_HEIGHT = 100
  const BORDER = { left: 1, right: 2, top: 3, bottom: 4 }
  const PADDING = { left: 5, right: 6, top: 7, bottom: 8 }

  it.each(['ltr', 'rtl'])('in %s, goes within the border, and optionally the padding', (direction) => {
    const el = createBox({
      direction,
      borderStyle: 'solid',
      borderColor: 'black',
      borderLeftWidth: BORDER.left + 'px',
      borderRightWidth: BORDER.right + 'px',
      borderTopWidth: BORDER.top + 'px',
      borderBottomWidth: BORDER.bottom + 'px',
      paddingLeft: PADDING.left + 'px',
      paddingRight: PADDING.right + 'px',
      paddingTop: PADDING.top + 'px',
      paddingBottom: PADDING.bottom + 'px',
    }, INNER_WIDTH, INNER_HEIGHT)

    expect(computeInnerRect(el)).toEqual({
      left: BORDER.left,
      right: BORDER.left + PADDING.left + INNER_WIDTH + PADDING.right,
      top: BORDER.top,
      bottom: BORDER.top + PADDING.top + INNER_HEIGHT + PADDING.bottom,
    })

    expect(computeInnerRect(el, true)).toEqual({
      left: BORDER.left + PADDING.left,
      right: BORDER.left + PADDING.left + INNER_WIDTH,
      top: BORDER.top + PADDING.top,
      bottom: BORDER.top + PADDING.top + INNER_HEIGHT,
    })
  })
})
