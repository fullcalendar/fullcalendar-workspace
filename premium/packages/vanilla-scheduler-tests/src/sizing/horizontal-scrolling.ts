import { describe, expect, it } from 'vitest'
import classNames from 'fullcalendar/protected-styles'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryPart, queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { createHeldFetch } from '../lib/fetching'

/*
With dayMinWidth, timeGrid views scroll horizontally, so the time axis and the header's first column
live outside the scrolling columns and must be kept in sync with them.
*/
describe('timeGrid sizing with horizontal scrolling', () => {
  /*
  The header's rows are split between the fixed first column and the scrolling columns. Their heights,
  grouped by row index: [fixed part, scrolling part] each.
  */
  function getHeaderRowHeightsByIndex(root: HTMLElement): { [rowIndex: string]: number[] } {
    const rowEls = Array.from(queryPart(root, 'tableHeader')!.querySelectorAll<HTMLElement>('[role=row][aria-rowindex]'))
    const heightsByRowIndex: { [rowIndex: string]: number[] } = {}

    for (const rowEl of rowEls) {
      (heightsByRowIndex[rowEl.getAttribute('aria-rowindex')!] ||= []).push(rowEl.getBoundingClientRect().height)
    }
    return heightsByRowIndex
  }

  function expectHeaderRowsInSync(root: HTMLElement, rowIndexes: string[]): void {
    const heightsByRowIndex = getHeaderRowHeightsByIndex(root)

    expect(Object.keys(heightsByRowIndex)).toEqual(rowIndexes)
    for (const heights of Object.values(heightsByRowIndex)) {
      expect(heights).toHaveLength(2) // the first column's part, and the scrolling part
      expect(heights[0]).toBeGreaterThan(0)
      expect(heights[0]).toBeCloseTo(heights[1], 0)
    }
  }

  // https://github.com/fullcalendar/fullcalendar/issues/5674
  it('keeps the slot labels lined up with the expanded slots', async () => {
    const calendar = initCalendar({
      initialView: 'timeGridWeek',
      dayMinWidth: 300,
      slotDuration: '04:00',
      expandRows: true,
    })
    await waitForSettle()
    const slotLaneEls = queryParts(calendar.el, 'slotLane')

    expect(slotLaneEls).toHaveLength(6)
    // expanded: the slots are much taller than their natural height
    expect(slotLaneEls[0].getBoundingClientRect().height).toBeGreaterThan(50)
    for (const slotLaneEl of slotLaneEls) {
      const time = slotLaneEl.getAttribute('data-time')
      const slotHeaderEl = queryParts(calendar.el, 'slotHeader').find((el) => el.getAttribute('data-time') === time)!

      expect(Math.abs(slotHeaderEl.getBoundingClientRect().top - slotLaneEl.getBoundingClientRect().top)).toBeLessThan(1)
    }
    expectHeaderRowsInSync(calendar.el, ['1']) // the date row
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5684
  it('keeps header rows in sync when resources arrive late in resource timeGrid', async () => {
    const heldResources = createHeldFetch(() => [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ])
    const calendar = initCalendar({
      initialView: 'resourceTimeGridWeek',
      dayMinWidth: 350,
      weekNumbers: true, // puts content in the header's first column
      resources: heldResources.fetch,
    })
    await waitForSettle()
    await heldResources.releaseAll()

    expectHeaderRowsInSync(calendar.el, ['1', '2']) // resource row, date row
  })

  describe('footerScrollbarSticky in resource timeGrid', () => {
    const options = {
      initialView: 'resourceTimeGridWeek',
      dayMinWidth: 350,
      weekNumbers: true,
      footerScrollbarSticky: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
    }

    it.each([
      ['ignores it when the height is fixed', 600, false],
      ['uses it when the height is auto', 'auto', true],
    ])('%s', async (_desc, height, isSticky) => {
      const calendar = initCalendar({ ...options, height })
      await waitForSettle()

      expect(calendar.el.querySelector(`.${classNames.footerScrollbarSticky}`) !== null).toBe(isSticky)
    })
  })
})
