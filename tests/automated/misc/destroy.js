import { countHandlers } from 'fullcalendar/tests/automated/lib/dom-misc'

describe('destroy', function() {
  pushOptions({
    defaultDate: '2016-06-01',
    droppable: true, // high chance of attaching global handlers
    editable: true, // same
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' }
    ],
    events: [
      { start: '2016-06-01T09:00:00', title: 'event1', resourceId: 'a' }
    ]
  })

  describeOptions('defaultView', {
    'when timelineDay view': 'timelineDay',
    'when vertical resource view': 'agendaDay',
    'when basic vertical resource view': 'basicDay'
  }, function() {
    it('unbinds all handlers', function(done) {
      setTimeout(function() { // other tests might still be cleaning up after their callbacks
        const documentCnt = countHandlers(document)
        const windowCnt = countHandlers(window)
        initCalendar({
          allDaySlot: false,
          eventAfterAllRender() {
            setTimeout(function() { // wait to render events
              currentCalendar.destroy()
              window.currentCalendar = null // for tests/util.js
              const $el = $('#calendar')
              expect($el.length).toBe(1)
              expect(countHandlers($el)).toBe(0)
              expect(countHandlers(document)).toBe(documentCnt)
              expect(countHandlers(window)).toBe(windowCnt)
              expect($el.attr('class') || '').toBe('')
              done()
            }, 100)
          }
        })
      }, 100)
      // needs non-zero waits unfortunately. other tests are probably
      // considered "done()" by karma, but still actually shutting down.
    })
  })
})
