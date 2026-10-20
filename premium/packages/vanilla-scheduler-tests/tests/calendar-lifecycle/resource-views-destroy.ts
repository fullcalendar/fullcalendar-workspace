import { describe, expect, it, onTestFinished } from 'vitest'
import { createCalendarElement, initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

/*
Tracks the listeners added to a target and not yet removed, until the test finishes.
*/
function trackListeners(target: EventTarget) {
  const active = new Set<string>()
  const ids = new WeakMap<object, number>()
  let nextId = 1
  const getKey = (type: string, listener: any, options?: boolean | AddEventListenerOptions) => {
    if (listener && !ids.has(listener)) {
      ids.set(listener, nextId++)
    }
    const capture = typeof options === 'boolean' ? options : Boolean(options?.capture)
    return `${type}:${listener ? ids.get(listener) : ''}:${capture}`
  }
  const origAdd = target.addEventListener
  const origRemove = target.removeEventListener

  target.addEventListener = function (type: string, listener: any, options?: any) {
    active.add(getKey(type, listener, options))
    return origAdd.call(this, type, listener, options)
  }
  target.removeEventListener = function (type: string, listener: any, options?: any) {
    active.delete(getKey(type, listener, options))
    return origRemove.call(this, type, listener, options)
  }
  onTestFinished(() => {
    delete (target as any).addEventListener
    delete (target as any).removeEventListener
  })

  return {
    get remaining() {
      return [...active].map((key) => key.split(':')[0]).sort()
    },
  }
}

describe('destroying resource views', () => {
  const options = {
    initialDate: '2016-06-01',
    droppable: true, // likely to attach global handlers
    editable: true, // same
    allDaySlot: false,
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
    ],
    events: [
      { start: '2016-06-01T09:00:00', title: 'event1', resourceId: 'a' },
    ],
  }

  async function renderAndDestroy(initialView: string) {
    const el = createCalendarElement()
    const windowListeners = trackListeners(window)
    const documentListeners = trackListeners(document)
    const elListeners = trackListeners(el)

    const calendar = initCalendar({ ...options, initialView }, el)
    await waitForSettle()
    const documentListenersBeforeDestroy = documentListeners.remaining
    calendar.destroy()

    return { el, windowListeners, documentListeners, documentListenersBeforeDestroy, elListeners }
  }

  it.each(['resourceTimelineDay', 'resourceTimeGridDay', 'resourceDayGridDay'])('removes all its handlers in %s', async (initialView) => {
    // a plain view's leftovers on its own element are the baseline (the vdom root's own listeners)
    const baseline = await renderAndDestroy('dayGridDay')
    const { el, windowListeners, documentListeners, documentListenersBeforeDestroy, elListeners } = await renderAndDestroy(initialView)

    expect(documentListenersBeforeDestroy.length).toBeGreaterThan(0) // the calendar had attached some
    expect(windowListeners.remaining).toEqual([])
    expect(documentListeners.remaining).toEqual([])
    expect(elListeners.remaining).toEqual(baseline.elListeners.remaining)
    expect(el.className).toBe('')
    expect(el.childNodes).toHaveLength(0)
  })
})
