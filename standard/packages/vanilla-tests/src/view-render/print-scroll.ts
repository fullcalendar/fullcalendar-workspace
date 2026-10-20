import { waitTimeout } from '../lib/misc'

/*
Leaving print re-applies where the user had scrolled (the initial-scroll target), not the initial date.
With dayMinWidth: vanilla-scheduler-tests misc/print-scroll-pannable
*/
describe('scroll position across printing', () => {
  pushOptions({
    initialDate: '2024-01-03',
    height: 250,
  })

  // the screen rows remount with their events unmeasured, so the position is reachable only later
  it('keeps where the user scrolled a dayGrid whose events measure after print', async () => {
    let events = []

    for (let i = 0; i < 40; i++) {
      events.push({ title: `event ${i}`, start: '2024-01-03' })
    }

    let calendar = initCalendar({
      initialView: 'dayGridDay',
      events,
    })
    await testScrollAcrossPrint(calendar, '.fc-daygrid-body')
  })

  async function testScrollAcrossPrint(calendar, scrollerSelector: string) {
    await waitTimeout(100)
    let scrollerEl = calendar.el.querySelector(scrollerSelector) as HTMLElement
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

    scrollerEl = calendar.el.querySelector(scrollerSelector) as HTMLElement
    expect(scrollerEl.scrollTop).toBe(80)
  }
})
