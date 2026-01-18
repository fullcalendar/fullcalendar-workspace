
// for side-effects
import '@fullcalendar/vanilla/all'

// export whole namespace
export * from './index'

// --
// HACK: install global custom-element, but not DRY with ./global
// for some reason this was being tree-shaken away
// --

import { FullCalendarElement } from './FullCalendarElement'

type FullCalendarElementType = typeof FullCalendarElement

declare global {
  // (extensions to globalThis must use `var`)
  // eslint-disable-next-line no-var
  var FullCalendarElement: FullCalendarElementType

  interface HTMLElementTagNameMap {
    'full-calendar': FullCalendarElement
  }
}

globalThis.FullCalendarElement = FullCalendarElement

customElements.define('full-calendar', FullCalendarElement)
