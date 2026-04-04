import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('scrollTime', () => {
  pushOptions({
    initialView: 'resourceTimeGridDay',
    dayMinWidth: 300, // another crucial difference from standard repo's scrollTime tests!!!
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  })

  it('accepts a string Duration', async () => {
    let calendar = initCalendar({
      scrollTime: '02:00:00',
      height: 400, // short enough to make scrolling happen
    })
    await waitTimeout()
    let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
    let timeGridWrapper = viewWrapper.timeGrid
    let slotTop = timeGridWrapper.base.getTimeTop('02:00:00') - $(timeGridWrapper.base.getCanvasEl()).offset().top
    let scrollTop = viewWrapper.getScrollEl().scrollTop
    let diff = Math.abs(slotTop - scrollTop)

    expect(slotTop).toBeGreaterThan(0)
    expect(scrollTop).toBeGreaterThan(0)
    expect(diff).toBeLessThan(3)
  })

  it('accepts a Duration object', async () => {
    let calendar = initCalendar({
      scrollTime: { hours: 2 },
      height: 400, // short enough to make scrolling happen
    })
    await waitTimeout()
    let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
    let timeGridWrapper = viewWrapper.timeGrid
    let slotTop = timeGridWrapper.base.getTimeTop('02:00:00') - $(timeGridWrapper.base.getCanvasEl()).offset().top
    let scrollTop = viewWrapper.getScrollEl().scrollTop
    let diff = Math.abs(slotTop - scrollTop)

    expect(slotTop).toBeGreaterThan(0)
    expect(scrollTop).toBeGreaterThan(0)
    expect(diff).toBeLessThan(3)
  })

  it('doesn\'t get applied on navigation when scrollTimeReset is false', () => {
    let calendar = initCalendar({
      scrollTime: '02:00:00',
      scrollTimeReset: false,
      height: 400, // short enough to make scrolling happen
    })
    let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
    let scrollEl = viewWrapper.getScrollEl()

    scrollEl.scrollTop = 99999
    let scrollTop = scrollEl.scrollTop

    calendar.next()
    expect(scrollEl.scrollTop).toBe(scrollTop) // stays the same
  })
})
