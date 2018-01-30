
describe('event styling hooks', function() {
  pushOptions({
    now: '2016-02-14',
    scrollTime: '00:00',
    resources: [
      {
        id: 'a',
        title: 'Resource A',
        eventClassName: 're1',
        eventColor: 'rgba(255,0,0,0.5)',
        eventBorderColor: 'rgba(0,0,255,0.5)'
      },
      {
        id: 'b',
        title: 'Resource B',
        eventClassName: [ 're2', 're3' ],
        eventColor: 'rgba(0,255,0,0.5)',
        eventTextColor: 'rgba(0,0,255,0.5)'
      }
    ]
  })

  const RED_RE = /rgba\(255,\s*0,\s*0/ // x-browser
  const GREEN_RE = /rgba\(0,\s*255,\s*0/ // x-browser
  const BLUE_RE = /rgba\(0,\s*0,\s*255/ // x-browser

  describe('when distinct resources', function() {

    describeOptions('defaultView', {
      'with agenda': 'agendaDay',
      'with timeline': 'timelineDay'
    }, function() {

      it('receives colors from resourceId', function(done) {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
          ],
          eventAfterAllRender() {
            expect($('.event1').css('background-color')).toMatch(RED_RE)
            done()
          }
        })
      })

      it('receives colors from resourceIds', function(done) {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceIds: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
          ],
          eventAfterAllRender() {
            const els = $('.event1')
            expect(els.length).toBe(2)
            expect(els.eq(0).css('background-color')).toMatch(RED_RE)
            expect(els.eq(1).css('background-color')).toMatch(GREEN_RE)
            done()
          }
        })
      })

      it('receives eventClassName from resourceId', function(done) {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
          ],
          eventAfterAllRender() {
            const el = $('.event1')
            expect(el.length).toBe(1)
            expect(el).toHaveClass('re1')
            expect(el).not.toHaveClass('re2')
            expect(el).not.toHaveClass('re3')
            done()
          }
        })
      })

      it('receives eventClassName from resourceIds', function(done) {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceIds: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
          ],
          eventAfterAllRender() {
            const els = $('.event1')
            expect(els.length).toBe(2)
            expect(els.eq(0)).toHaveClass('re1')
            expect(els.eq(0)).not.toHaveClass('re2')
            expect(els.eq(0)).not.toHaveClass('re3')
            expect(els.eq(1)).not.toHaveClass('re1')
            expect(els.eq(1)).toHaveClass('re2')
            expect(els.eq(1)).toHaveClass('re3')
            done()
          }
        })
      })
    })
  })

  describe('when no distinct resources', function() {
    pushOptions({
      defaultView: 'agendaWeek'
    })

    it('receives colors from resourceId', function(done) {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
        ],
        eventAfterAllRender() {
          expect($('.event1').css('background-color')).toMatch(RED_RE) // x-browser
          done()
        }
      })
    })

    it('receives colors from resourceIds', function(done) {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceIds: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
        ],
        eventAfterAllRender() {
          const el = $('.event1')
          expect(el.length).toBe(1)
          expect(el.css('border-left-color')).toMatch(BLUE_RE)
          expect(el.css('color')).toMatch(BLUE_RE) // text color
          done()
        }
      })
    })

    it('receives eventClassName from resourceId', function(done) {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' }
        ],
        eventAfterAllRender() {
          const el = $('.event1')
          expect(el.length).toBe(1)
          expect(el).toHaveClass('re1')
          expect(el).not.toHaveClass('re2')
          expect(el).not.toHaveClass('re3')
          done()
        }
      })
    })

    it('receives eventClassName from resourceIds', function(done) {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceIds: [ 'a', 'b' ], start: '2016-02-14T01:00:00' }
        ],
        eventAfterAllRender() {
          const el = $('.event1')
          expect(el.length).toBe(1)
          expect(el).toHaveClass('re1')
          expect(el).toHaveClass('re2')
          expect(el).toHaveClass('re3')
          done()
        }
      })
    })
  })
})
