describe('event styling hooks', () => {
  pushOptions({
    now: '2016-02-14',
    scrollTime: '00:00',
    resources: [
      {
        id: 'a',
        title: 'Resource A',
        eventClassNames: 're1',
        eventColor: 'rgba(255,0,0,0.5)',
        eventBorderColor: 'rgba(0,0,255,0.5)',
      },
      {
        id: 'b',
        title: 'Resource B',
        eventClassNames: ['re2', 're3'],
        eventColor: 'rgba(0,255,0,0.5)',
        eventTextColor: 'rgba(0,0,255,0.5)',
      },
    ],
  })

  const RED_RE = /rgba\(255,\s*0,\s*0/ // x-browser
  const GREEN_RE = /rgba\(0,\s*255,\s*0/ // x-browser
  const BLUE_RE = /rgba\(0,\s*0,\s*255/ // x-browser

  describe('when distinct resources', () => {
    describeOptions('initialView', {
      'with timeGrid': 'resourceTimeGridDay',
      'with timeline': 'resourceTimelineDay',
    }, () => {
      it('receives colors from resourceId', () => {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' },
          ],
        })
        expect($('.event1').css('background-color')).toMatch(RED_RE)
      })

      it('receives colors from resourceIds', () => {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceIds: ['a', 'b'], start: '2016-02-14T01:00:00' },
          ],
        })
        const els = $('.event1')
        expect(els.length).toBe(2)
        expect(els.eq(0).css('background-color')).toMatch(RED_RE)
        expect(els.eq(1).css('background-color')).toMatch(GREEN_RE)
      })

      it('receives eventClassName from resourceId', () => {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' },
          ],
        })
        const el = $('.event1')
        expect(el.length).toBe(1)
        expect(el).toHaveClass('re1')
        expect(el).not.toHaveClass('re2')
        expect(el).not.toHaveClass('re3')
      })

      it('receives eventClassName from resourceIds', () => {
        initCalendar({
          events: [
            { id: '1', title: 'event 1', className: 'event1', resourceIds: ['a', 'b'], start: '2016-02-14T01:00:00' },
          ],
        })
        const els = $('.event1')
        expect(els.length).toBe(2)
        expect(els.eq(0)).toHaveClass('re1')
        expect(els.eq(0)).not.toHaveClass('re2')
        expect(els.eq(0)).not.toHaveClass('re3')
        expect(els.eq(1)).not.toHaveClass('re1')
        expect(els.eq(1)).toHaveClass('re2')
        expect(els.eq(1)).toHaveClass('re3')
      })
    })
  })

  describe('when no distinct resources', () => {
    pushOptions({
      initialView: 'timeGridWeek',
    })

    it('receives colors from resourceId', () => {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' },
        ],
      })
      expect($('.event1').css('background-color')).toMatch(RED_RE) // x-browser
    })

    it('receives colors from resourceIds', () => {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceIds: ['a', 'b'], start: '2016-02-14T01:00:00' },
        ],
      })
      const el = $('.event1')
      expect(el.length).toBe(1)
      expect(el.css('border-left-color')).toMatch(BLUE_RE)
      expect(el.find('.fc-event-title').css('color')).toMatch(BLUE_RE) // text color
    })

    it('receives eventClassName from resourceId', () => {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceId: 'a', start: '2016-02-14T01:00:00' },
        ],
      })
      const el = $('.event1')
      expect(el.length).toBe(1)
      expect(el).toHaveClass('re1')
      expect(el).not.toHaveClass('re2')
      expect(el).not.toHaveClass('re3')
    })

    it('receives eventClassName from resourceIds', () => {
      initCalendar({
        events: [
          { id: '1', title: 'event 1', className: 'event1', resourceIds: ['a', 'b'], start: '2016-02-14T01:00:00' },
        ],
      })
      const el = $('.event1')
      expect(el.length).toBe(1)
      expect(el).toHaveClass('re1')
      expect(el).toHaveClass('re2')
      expect(el).toHaveClass('re3')
    })
  })
})
