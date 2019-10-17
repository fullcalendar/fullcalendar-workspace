import ListenerCounter from 'package-tests/lib/ListenerCounter'

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
    'when resourceTimelineDay view': 'resourceTimelineDay',
    'when vertical resource view': 'resourceTimeGridDay',
    'when dayGrid vertical resource view': 'resourceDayGridDay'
  }, function() {
    it('unbinds all handlers', function(done) {
      setTimeout(function() { // other tests might still be cleaning up after their callbacks
        const $el = $('<div />').appendTo('body')

        const windowListenerCounter = new ListenerCounter(window)
        const docListenerCounter = new ListenerCounter(document)
        const elListenerCounter = new ListenerCounter($el[0])

        windowListenerCounter.startWatching()
        docListenerCounter.startWatching()
        elListenerCounter.startWatching()

        initCalendar({
          allDaySlot: false,
          _eventsPositioned() {
            setTimeout(function() { // wait to render events

              window['currentCalendar'].destroy()
              window['currentCalendar'] = null // for tests/util.js

              expect($el.length).toBe(1)
              expect($el.attr('class') || '').toBe('')

              expect(windowListenerCounter.stopWatching()).toBe(0)
              expect(docListenerCounter.stopWatching()).toBe(0)
              expect(elListenerCounter.stopWatching()).toBe(0)

              $el.remove()
              done()
            }, 100)
          }
        }, $el)
      }, 100)
      // needs non-zero waits unfortunately. other tests are probably
      // considered "done()" by karma, but still actually shutting down.
    })
  })
})
