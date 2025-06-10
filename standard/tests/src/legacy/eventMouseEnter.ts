describe('eventMouseEnter', () => {
  pushOptions({
    initialDate: '2014-08-01',
    scrollTime: '00:00:00',
  });

  ['dayGridMonth', 'timeGridWeek'].forEach((viewName) => {
    describe('for ' + viewName + ' view', () => {
      pushOptions({
        initialView: viewName,
      })

      it('doesn\'t trigger a eventMouseLeave when updating an event', (done) => {
        let options = {
          events: [{
            title: 'event',
            start: '2014-08-02T01:00:00',
            className: 'event',
          }],
          eventMouseEnter(data) {
            expect(typeof data.event).toBe('object')
            expect(typeof data.jsEvent).toBe('object')
            data.event.setProp('title', 'YO')
          },
          eventMouseLeave(data) {},
        }

        spyOn(options, 'eventMouseEnter')
        spyOn(options, 'eventMouseLeave')

        initCalendar(options)
        $('.event').simulate('mouseover')

        setTimeout(() => {
          expect(options.eventMouseEnter).toHaveBeenCalled()
          expect(options.eventMouseLeave).not.toHaveBeenCalled()
          done()
        }, 100)
      })
    })
  })

  it('gets fired for background events', (done) => {
    let mouseoverCalled = false

    initCalendar({
      events: [{
        start: '2014-08-02',
        display: 'background',
        className: 'event',
      }],
      eventMouseEnter(data) {
        expect(data.event.display).toBe('background')
        mouseoverCalled = true
      },
      eventMouseLeave() {
        expect(mouseoverCalled).toBe(true)
        done()
      },
    })

    $('.event')
      .simulate('mouseover')
      .simulate('mouseout')
      .simulate('mouseleave') // helps out listenBySelector
  })
})
