import {
  createPlugin,
  findElements,
  flushToDom,
  CalendarContext,
  removeExact,
  config,
} from '@fullcalendar/common'

import premiumCommonPlugin from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations. TODO: remove?
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import './main.css'

config.COLLAPSIBLE_WIDTH_THRESHOLD = 1200

let contexts: CalendarContext[] = []
let undoFuncs: (() => void)[] = []

export default createPlugin({
  deps: [
    premiumCommonPlugin,
  ],
  contextInit(context) {
    if (!contexts.length) {
      attachGlobalHandlers()
    }
    contexts.push(context)
    context.calendarApi.on('_unmount', () => {
      removeExact(contexts, context)
      if (!contexts.length) {
        removeGlobalHandlers()
      }
    })
  },
})

function attachGlobalHandlers() {
  window.addEventListener('beforeprint', handleBeforePrint)
  window.addEventListener('afterprint', handleAfterPrint)

  // // for testing
  // let forPrint = false
  // document.addEventListener('keypress', (ev) => {
  //   if (ev.key === 'p') {
  //     forPrint = !forPrint
  //     if (forPrint) {
  //       handleBeforePrint()
  //     } else {
  //       handleAfterPrint()
  //     }
  //   }
  // })
}

function removeGlobalHandlers() {
  window.removeEventListener('beforeprint', handleBeforePrint)
  window.removeEventListener('afterprint', handleAfterPrint)
}

function handleBeforePrint() {
  let scrollEls = queryScrollerEls()
  let scrollCoords = queryScrollerCoords(scrollEls)

  for (let context of contexts) {
    context.emitter.trigger('_beforeprint')
  }

  flushToDom() // because printing grabs DOM immediately after

  killHorizontalScrolling(scrollEls, scrollCoords)
  undoFuncs.push(() => restoreScrollerCoords(scrollEls, scrollCoords))

  undoFuncs.push(freezeScrollgridWidths())
}

function handleAfterPrint() {
  for (let context of contexts) {
    context.emitter.trigger('_afterprint')
  }

  flushToDom() // guarantee that there are real scrollers

  while (undoFuncs.length) {
    undoFuncs.shift()()
  }
}

// scrollgrid widths

function freezeScrollgridWidths() {
  let els = findElements(document.body, '.fc-scrollgrid')
  els.forEach(freezeScrollGridWidth)
  return () => els.forEach(unfreezeScrollGridWidth)
}

function freezeScrollGridWidth(el: HTMLElement) {
  let elWidth = el.getBoundingClientRect().width

  // along with collapsibleWidth, this is a hack for #5707
  if (!el.classList.contains('fc-scrollgrid-collapsible') || elWidth < config.COLLAPSIBLE_WIDTH_THRESHOLD) {
    el.style.width = elWidth + 'px'
  }
}

function unfreezeScrollGridWidth(el) {
  el.style.width = ''
}

// scrollers
// TODO: use scroll normalization!? yes

function queryScrollerEls() {
  return findElements(document.body, '.fc-scroller-harness > .fc-scroller')
}

interface ScrollerCoords {
  scrollLeft: number
  scrollTop: number
  overflowX: string
  overflowY: string
  marginBottom: string
}

function queryScrollerCoords(els: HTMLElement[]): ScrollerCoords[] {
  return els.map((el) => {
    let computedStyle = window.getComputedStyle(el)

    return {
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      overflowX: computedStyle.overflowX,
      overflowY: computedStyle.overflowY,
      marginBottom: computedStyle.marginBottom,
    }
  })
}

function killHorizontalScrolling(els: HTMLElement[], coords: ScrollerCoords[]) {
  els.forEach((el, i) => {
    el.style.overflowX = 'visible' // need to clear X/Y to get true overflow
    el.style.overflowY = 'visible' // "
    el.style.marginBottom = '' // for clipping away scrollbar. disable
    el.style.left = -coords[i].scrollLeft + 'px' // simulate scrollLeft! will be position:relative
  })
}

function restoreScrollerCoords(els: HTMLElement[], coords: ScrollerCoords[]) { // restores vertical scrolling too
  els.forEach((el, i) => {
    let c = coords[i]
    el.style.overflowX = c.overflowX
    el.style.overflowY = c.overflowY
    el.style.marginBottom = c.marginBottom
    el.style.left = ''
    el.scrollLeft = c.scrollLeft
    el.scrollTop = c.scrollTop
  })
}
