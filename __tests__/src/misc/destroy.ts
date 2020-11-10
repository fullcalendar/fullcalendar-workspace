import { ListenerCounter } from 'fullcalendar-tests/src/lib/ListenerCounter'
import { primeVDomContainer } from 'fullcalendar-tests/src/lib/vdom-misc'

describe('destroy', () => {
  pushOptions({
    initialDate: '2016-06-01',
    droppable: true, // high chance of attaching global handlers
    editable: true, // same
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
    ],
    events: [
      { start: '2016-06-01T09:00:00', title: 'event1', resourceId: 'a' },
    ],
  })

  describeOptions('initialView', {
    'when resourceTimelineDay view': 'resourceTimelineDay',
    'when vertical resource view': 'resourceTimeGridDay',
    'when dayGrid vertical resource view': 'resourceDayGridDay',
  }, () => {
    it('unbinds all handlers', (done) => {
      setTimeout(() => { // other tests might still be cleaning up after their callbacks
        const $el = $('<div />').appendTo('body')
        primeVDomContainer($el[0])

        const windowListenerCounter = new ListenerCounter(window)
        const docListenerCounter = new ListenerCounter(document)
        const elListenerCounter = new ListenerCounter($el[0])

        windowListenerCounter.startWatching()
        docListenerCounter.startWatching()
        elListenerCounter.startWatching()

        initCalendar({
          allDaySlot: false,
        }, $el)

        setTimeout(() => {
          window.currentCalendar.destroy()
          window.currentCalendar = null // for tests/util.js

          expect($el.length).toBe(1)
          expect($el.attr('class') || '').toBe('')

          expect(windowListenerCounter.stopWatching()).toBe(0)
          expect(docListenerCounter.stopWatching()).toBe(0)
          expect(elListenerCounter.stopWatching()).toBe(0)

          $el.remove()
          done()
        }, 100)
      }, 100)
      // needs non-zero waits unfortunately. other tests are probably
      // considered "done()" by karma, but still actually shutting down.
    })
  })
})
