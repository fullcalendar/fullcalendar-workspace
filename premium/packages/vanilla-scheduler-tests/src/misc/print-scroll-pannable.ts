import internalClassNames from 'fullcalendar/protected-styles'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

/*
Leaving print re-applies where the user had scrolled. With dayMinWidth, the header, body and footer
scrollers are synced horizontally, and only the body scrolls vertically
*/
describe('scroll position across printing, with dayMinWidth', () => {
  pushOptions({
    initialDate: '2024-01-03',
    height: 250,
    dayMinWidth: 150,
  })

  it('keeps where the user scrolled a dayGrid', async () => {
    let calendar = initCalendar({
      initialView: 'dayGridYear',
    })
    await testScrollAcrossPrint(calendar, () => calendar.el.querySelector('.fc-daygrid-body'))
  })

  it('keeps where the user scrolled a timeGrid', async () => {
    let calendar = initCalendar({
      initialView: 'timeGridWeek',
      scrollTime: '00:00',
    })
    // the body's main scroller, which scrolls both ways. the axis scroller is synced to it
    await testScrollAcrossPrint(calendar, () => {
      let scrollerEls = calendar.el.querySelectorAll(`.fc-timegrid-body .${internalClassNames.internalScroller}`)
      return scrollerEls[scrollerEls.length - 1]
    })
  })

  async function testScrollAcrossPrint(calendar, getScrollerEl: () => Element) {
    await waitTimeout(100)
    let scrollerEl = getScrollerEl() as HTMLElement
    expect(scrollerEl.scrollHeight).toBeGreaterThan(scrollerEl.clientHeight + 100) // sanity check

    // a user scroll: a wheel event, then a scroll, then the scroll-end wait
    scrollerEl.dispatchEvent(new Event('wheel'))
    scrollerEl.scrollTop = 80
    scrollerEl.dispatchEvent(new Event('scroll'))
    await waitTimeout(600)

    calendar.trigger('_beforeprint')
    await waitTimeout(100)
    calendar.trigger('_afterprint')
    await waitTimeout(200)

    scrollerEl = getScrollerEl() as HTMLElement
    expect(scrollerEl.scrollTop).toBe(80)
  }
})

/*
Toggling dayMinWidth swaps the layout, and with it the scroller, which starts at 0
*/
describe('scroll position across a dayMinWidth change', () => {
  pushOptions({
    initialDate: '2024-01-03',
    height: 250,
    scrollTime: '00:00',
  })

  it('keeps where the user scrolled a timeGrid, into pannable and back', async () => {
    let calendar = initCalendar({
      initialView: 'timeGridWeek',
    })
    // the body's last scroller is the main one, in both layouts
    const getScrollerEl = () => {
      let scrollerEls = calendar.el.querySelectorAll(`.fc-timegrid-body .${internalClassNames.internalScroller}`)
      return scrollerEls[scrollerEls.length - 1] as HTMLElement
    }

    await waitTimeout(100)
    await userScroll(getScrollerEl(), 80)
    calendar.setOption('dayMinWidth', 150)
    await waitTimeout(200)
    expect(getScrollerEl().scrollTop).toBe(80)

    await userScroll(getScrollerEl(), 120)
    calendar.setOption('dayMinWidth', null)
    await waitTimeout(200)
    expect(getScrollerEl().scrollTop).toBe(120)
  })

  it('keeps where the user scrolled a dayGrid, into pannable', async () => {
    let calendar = initCalendar({
      initialView: 'dayGridYear',
    })
    const getScrollerEl = () => calendar.el.querySelector('.fc-daygrid-body') as HTMLElement

    await waitTimeout(100)
    await userScroll(getScrollerEl(), 80)
    calendar.setOption('dayMinWidth', 150)
    await waitTimeout(200)
    expect(getScrollerEl().scrollTop).toBe(80)
  })

  // a wheel event, then a scroll, then the scroll-end wait
  async function userScroll(scrollerEl: HTMLElement, top: number) {
    scrollerEl.dispatchEvent(new Event('wheel'))
    scrollerEl.scrollTop = top
    scrollerEl.dispatchEvent(new Event('scroll'))
    await waitTimeout(600)
  }
})
