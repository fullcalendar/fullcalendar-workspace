import { describe, expect, it } from 'vitest'
import { CalendarOptions } from 'fullcalendar'
import { config } from 'fullcalendar/protected-api'
import { createCalendarElement, initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { TimelineModel } from '../lib/models/timeline'
import { getResourceAreaRows, getSlotHeaderDates, getSlotLanes, getTimeScroller } from '../lib/models/timeline-layout'

/*
With virtualization, a resource timeline renders only the slots and rows near the viewport, and
sizes them from what it has measured.
*/

const options: CalendarOptions = {
  initialView: 'resourceTimelineDay',
  initialDate: '2026-10-05',
  virtualization: true,
}

describe('virtualized slot labels', () => {
  const LABEL_WIDTH = 34
  const WIDEST_LABEL_WIDTH = 44 // of the 12pm label

  /*
  Slots are as wide as the widest rendered label. At the slot width of the narrower labels, the 12pm
  label is rendered at the edge of the viewport. At the slot width it causes, it's too far out to be
  rendered. Fixed widths keep this independent of fonts.
  */
  it.each(['ltr', 'rtl'] as const)('settles when the widest label only fits at narrower slots, in %s', async (direction) => {
    const el = createCalendarElement()
    el.style.width = '830px'
    const calendar = initCalendar({
      ...options,
      direction,
      scrollTime: '00:00',
      resourceColumnsWidth: 200,
      resources: [],
      slotHeaderContent: (arg) => ({
        html: `<div style="width:${arg.text === '12pm' ? WIDEST_LABEL_WIDTH : LABEL_WIDTH}px"></div>`,
      }),
    }, el)
    await waitForSettle() // a render loop would never settle, failing the test with a timeout

    // the scenario still holds: the widest label is virtualized away at the slot width it causes
    const headerDates = getSlotHeaderDates(calendar.el)
    expect(headerDates).toContain('2026-10-05T00:00:00')
    expect(headerDates).not.toContain('2026-10-05T12:00:00')
  })

  // labels of prior date ranges are remembered too (the header row is reused), but don't count
  it('forgets the label widths of prior date ranges', async () => {
    const calendar = initCalendar({
      ...options,
      scrollTime: '00:00',
      resources: [],
      slotHeaderContent: (arg) => ({
        html: `<div style="width:${arg.date.getUTCDate() === 5 ? 80 : LABEL_WIDTH}px"></div>`,
      }),
    })
    await waitForSettle()
    const getSlotWidth = () => getSlotLanes(calendar.el)[0].getBoundingClientRect().width
    const wideSlotWidth = getSlotWidth()

    calendar.next()
    await waitForSettle()
    expect(getSlotWidth()).toBeLessThan(wideSlotWidth)
  })
})

// https://github.com/fullcalendar/fullcalendar/issues/8127
describe('virtualized row height', () => {
  const STACK_SIZE = 6

  function initStackCalendar() {
    return initCalendar({
      ...options,
      scrollTime: '00:00',
      height: 500,
      resources: [{ id: 'a', title: 'a' }, { id: 'b', title: 'b' }],
      events: [
        // a stack on screen
        ...Array.from({ length: STACK_SIZE }, () => ({
          resourceId: 'a',
          start: '2026-10-05T00:00:00',
          end: '2026-10-05T02:00:00',
        })),
        // off screen
        { resourceId: 'a', start: '2026-10-05T22:00:00', end: '2026-10-05T23:00:00' },
      ],
    })
  }

  it('fits a stack of on-screen events when other events are off screen', async () => {
    const calendar = initStackCalendar()
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    const eventEls = timeline.getEventEls()
    const laneARect = timeline.getResourceLane('a').getBoundingClientRect()
    expect(eventEls).toHaveLength(STACK_SIZE)
    expect(Math.max(...eventEls.map((el) => el.getBoundingClientRect().bottom))).toBeLessThanOrEqual(laneARect.bottom + 1)
    expect(timeline.getResourceLane('b').getBoundingClientRect().top).toBeGreaterThanOrEqual(laneARect.bottom - 1)
  })

  // unlike a timeline without virtualization, where a row fits all its events
  it('shrinks to the on-screen events after scrolling past a stack, and grows back', async () => {
    const calendar = initStackCalendar()
    await waitForSettle()
    const getRowAHeight = () => new TimelineModel(calendar.el).getResourceLane('a').getBoundingClientRect().height
    const stackHeight = getRowAHeight()

    calendar.scrollToTime('22:00')
    await waitForSettle()
    expect(getRowAHeight()).toBeLessThan(stackHeight / 2)

    calendar.scrollToTime('00:00')
    await waitForSettle()
    expect(getRowAHeight()).toBe(stackHeight)
  })
})

/*
Rows are measured once rendered. Unmeasured rows are estimated from rows measured recently, and the
estimate changes only when a scroll ends. Through the scroll, the scroll height stays stable
(differences from the estimate are corrected when it ends), so a scrollbar drag tracks the pointer.
*/
describe('virtualized fast scrolling', () => {
  const SCROLL_STEP = 2000
  const SCROLL_STEP_COUNT = 4

  const resources = Array.from({ length: 1000 }, (_, i) => {
    const id = 'r' + String(i).padStart(4, '0')
    return { id, title: id }
  })

  function initManyRowCalendar(moreOptions: CalendarOptions) {
    return initCalendar({ ...options, height: 500, resources, ...moreOptions })
  }

  // waits past the scroll-end debounce, which waitForSettle doesn't wait on
  async function waitForScrollEnd(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, config.scrollEndWait))
    await waitForSettle()
  }

  /*
  Scrolls further as soon as new rows render, before they're measured, so the measurements report
  rows that are now above the viewport, like during a fast scroll or scrollbar drag.
  */
  async function scrollPastUnmeasuredRows(scrollerEl: HTMLElement): Promise<void> {
    let stepsLeft = SCROLL_STEP_COUNT - 1
    const observer = new MutationObserver(() => {
      if (stepsLeft) {
        stepsLeft--
        scrollerEl.scrollTop += SCROLL_STEP
      }
    })
    observer.observe(scrollerEl, { childList: true, subtree: true })
    scrollerEl.scrollTop += SCROLL_STEP
    await waitForSettle()
    observer.disconnect()
  }

  async function expectStableFastScroll(scrollerEl: HTMLElement): Promise<void> {
    const initialScrollHeight = scrollerEl.scrollHeight

    await scrollPastUnmeasuredRows(scrollerEl)
    const scrollTop = scrollerEl.scrollTop
    expect(scrollTop).toBe(SCROLL_STEP * SCROLL_STEP_COUNT)
    expect(scrollerEl.scrollHeight).toBe(initialScrollHeight)

    await waitForScrollEnd()
    expect(scrollerEl.scrollTop).toBe(scrollTop)
    expect(scrollerEl.scrollHeight).toBe(initialScrollHeight)
  }

  // https://github.com/fullcalendar/fullcalendar/issues/8135
  it('doesn\'t correct the scroll for empty lanes shorter than their row', async () => {
    // the lane (12px, empty) is shorter than the row (40px, with the cell's 16px of padding)
    const calendar = initManyRowCalendar({ resourceCellContent: { html: '<div style="height:24px"></div>' } })
    await waitForSettle()

    await expectStableFastScroll(getTimeScroller(calendar.el))
  })

  // https://github.com/fullcalendar/fullcalendar/issues/8135
  it('estimates unmeasured rows from measured rows, keeping the scroll stable when they\'re alike', async () => {
    const calendar = initManyRowCalendar({ resourceCellContent: { html: '<div style="height:60px"></div>' } })
    await waitForSettle()

    await expectStableFastScroll(getTimeScroller(calendar.el))
  })

  it('keeps the visible row in place when the estimate changes at scroll end', async () => {
    const calendar = initManyRowCalendar({
      // enough tall rows to set the first estimate, then short rows, measured during the scroll
      resourceCellContent: (arg) => ({
        html: `<div style="height:${arg.resource.id < 'r0010' ? 80 : 10}px"></div>`,
      }),
    })
    await waitForSettle()
    const scrollerEl = getTimeScroller(calendar.el)

    const getFirstVisibleRow = () => {
      const scrollerTop = scrollerEl.getBoundingClientRect().top
      return getResourceAreaRows(calendar.el)
        .map((row) => ({ id: row.resourceId, top: row.el.getBoundingClientRect().top - scrollerTop }))
        .find((row) => row.top >= 0)!
    }

    scrollerEl.scrollTop = 20000
    await waitForSettle() // the rows there are measured, but the scroll hasn't ended
    const rowDuringScroll = getFirstVisibleRow()
    const scrollHeightDuringScroll = scrollerEl.scrollHeight

    await waitForScrollEnd()
    expect(scrollerEl.scrollHeight).toBeLessThan(scrollHeightDuringScroll / 2) // the estimate came down
    const rowAfterScroll = getFirstVisibleRow()
    expect(rowAfterScroll.id).toBe(rowDuringScroll.id)
    expect(Math.abs(rowAfterScroll.top - rowDuringScroll.top)).toBeLessThanOrEqual(1)
  })

  // the window scrolls instead, and keeping the visible row in place works only for the calendar's scroller
  it('doesn\'t estimate unmeasured rows from measured rows with height:auto', async () => {
    const calendar = initManyRowCalendar({
      height: 'auto',
      resourceCellContent: { html: '<div style="height:60px"></div>' },
    })
    await waitForSettle()

    // unmeasured rows keep the initial estimate, well under the 60px of content in the measured ones
    expect(getTimeScroller(calendar.el).scrollHeight).toBeLessThan(resources.length * 60)
  })
})
