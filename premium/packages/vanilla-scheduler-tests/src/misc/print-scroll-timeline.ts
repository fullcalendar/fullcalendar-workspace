import { ignoreResizeObserverLoops, waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

/*
After printing, the timelines' layouts are new instances, which start from the scroll target their view
held through print (initialScroll), not from scrollTime
*/
describe('timeline scroll position across print', () => {
  it('keeps where the user scrolled a timeline', async () => {
    await testScrollAcrossPrint({ initialView: 'timelineDay' })
  })

  it('keeps where the user scrolled a resource timeline', async () => {
    await testScrollAcrossPrint({
      initialView: 'resourceTimelineDay',
      resources: [{ id: 'a', title: 'Resource A' }],
    })
  })

  async function testScrollAcrossPrint(calendarOptions: object) {
    let containerEl = document.createElement('div')
    containerEl.style.width = '600px'
    document.body.appendChild(containerEl)

    // the last: in a resource timeline, the spreadsheet's body has the class too
    function getScrollerEl() {
      let scrollerEls = containerEl.querySelectorAll('.fc-timeline-body')
      return scrollerEls[scrollerEls.length - 1] as HTMLElement
    }

    await ignoreResizeObserverLoops(async () => {
      let calendar = initCalendar({
        initialDate: '2024-01-03',
        scrollTime: '00:00',
        ...calendarOptions,
      }, containerEl)

      try {
        await waitTimeout(100)
        let scrollerEl = getScrollerEl()
        expect(scrollerEl.scrollLeft).toBe(0) // sanity check: the initial scroll

        // a user scroll: a wheel event, then a scroll, then the scroll-end wait
        scrollerEl.dispatchEvent(new Event('wheel'))
        scrollerEl.scrollLeft = 80
        scrollerEl.dispatchEvent(new Event('scroll'))
        await waitTimeout(600)

        calendar.trigger('_beforeprint')
        await waitTimeout(100)
        calendar.trigger('_afterprint')
        await waitTimeout(100)

        let newScrollerEl = getScrollerEl()
        expect(newScrollerEl).not.toBe(scrollerEl) // sanity check: a new layout
        expect(newScrollerEl.scrollLeft).toBe(80)
      } finally {
        calendar.destroy()
        containerEl.remove()
      }
    })
  }
})
