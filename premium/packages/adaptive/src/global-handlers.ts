import { CalendarContext, removeExact } from '@fullcalendar/core/internal'

let contexts: CalendarContext[] = []

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

  /*
  // for testing
  let forPrint = false
  document.addEventListener('keypress', (ev) => {
    if (ev.key === 'p') {
      forPrint = !forPrint
      if (forPrint) {
        handleBeforePrint()
      } else {
        handleAfterPrint()
      }
    }
  })
  */
}

function removeGlobalHandlers() {
  window.removeEventListener('beforeprint', handleBeforePrint)
  window.removeEventListener('afterprint', handleAfterPrint)
}

function handleBeforePrint() {
  for (let context of contexts) {
    context.emitter.trigger('_beforeprint')
  }
}

function handleAfterPrint() {
  for (let context of contexts) {
    context.emitter.trigger('_afterprint')
  }
}
