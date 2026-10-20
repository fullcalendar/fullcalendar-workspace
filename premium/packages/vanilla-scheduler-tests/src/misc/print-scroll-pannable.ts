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
    await waitTimeout(100)
    let scrollerEl = calendar.el.querySelector('.fc-daygrid-body') as HTMLElement
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

    scrollerEl = calendar.el.querySelector('.fc-daygrid-body') as HTMLElement
    expect(scrollerEl.scrollTop).toBe(80)
  })
})
