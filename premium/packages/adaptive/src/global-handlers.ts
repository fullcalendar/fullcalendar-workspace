import {
  findElements,
  CalendarContext,
  removeExact,
  config,
} from '@fullcalendar/core/internal'
import { flushSync } from '@fullcalendar/core/preact'

config.COLLAPSIBLE_WIDTH_THRESHOLD = 1200

let contexts: CalendarContext[] = []
let undoFuncs: (() => void)[] = []

export function contextInit(context: CalendarContext): void {
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
}

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
  for (let context of contexts) {
    context.emitter.trigger('_beforeprint')
  }

  flushSync(() => { // because printing grabs DOM immediately after
    undoFuncs.push(freezeScrollgridWidths())
  })
}

function handleAfterPrint() {
  for (let context of contexts) {
    context.emitter.trigger('_afterprint')
  }

  flushSync(() => { // guarantee that there are real scrollers
    while (undoFuncs.length) {
      undoFuncs.shift()()
    }
  })
}

// scrollgrid widths
// TODO: kill this stuff!!!

function freezeScrollgridWidths() {
  let els = findElements(document.body, '.fcnew-scrollgrid')
  els.forEach(freezeScrollGridWidth)
  return () => els.forEach(unfreezeScrollGridWidth)
}

function freezeScrollGridWidth(el: HTMLElement) {
  let elWidth = el.getBoundingClientRect().width

  // along with collapsibleWidth, this is a hack for #5707
  if (!el.classList.contains('fcnew-scrollgrid-collapsible') || elWidth < config.COLLAPSIBLE_WIDTH_THRESHOLD) {
    el.style.width = elWidth + 'px'
  }
}

function unfreezeScrollGridWidth(el) {
  el.style.width = ''
}
