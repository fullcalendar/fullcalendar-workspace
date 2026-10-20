import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { CalendarOptions } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryPart, queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { getSlotHeaderRows } from '../lib/models/timeline-layout'

describe('timeline navLinks', () => {
  const options: CalendarOptions = {
    navLinks: true,
    initialDate: '2023-04-03',
    views: {
      timelineThreeDay: { type: 'timeline', duration: { days: 3 } },
      timelineTwoMonth: { type: 'timeline', duration: { months: 2 } },
    },
  }

  /*
  The aria-labels of the slot headers' navLinks, by header row.
  */
  function getNavLinkLabels(root: HTMLElement): string[][] {
    return getSlotHeaderRows(root).map((cellEls) => cellEls
      .map((cellEl) => queryPart(cellEl, 'navLink'))
      .filter((el): el is HTMLElement => Boolean(el))
      .map((el) => el.getAttribute('aria-label')!))
  }

  it.each([
    ['a multi-day view, on its days', 'timelineThreeDay', {}, [
      ['Go to April 3, 2023', 'Go to April 4, 2023', 'Go to April 5, 2023'],
      [],
    ]],
    ['an hourly week with custom slotHeaderFormat, on its days', 'resourceTimelineWeek', {
      slotDuration: { hours: 1 },
      slotHeaderFormat: [{ year: 'numeric', month: 'numeric', day: 'numeric' }, { hour: 'numeric' }],
    }, [
      ['Go to April 2, 2023', 'Go to April 3, 2023', 'Go to April 4, 2023', 'Go to April 5, 2023',
        'Go to April 6, 2023', 'Go to April 7, 2023', 'Go to April 8, 2023'],
      [],
    ]],
  ])('renders navLinks in %s', async (_desc, initialView, moreOptions, expectedLabels) => {
    const calendar = initCalendar({ ...options, ...moreOptions, initialView })
    await waitForSettle()

    expect(getNavLinkLabels(calendar.el)).toEqual(expectedLabels)
  })

  it('renders navLinks on both header rows of a daily week with custom slotHeaderFormat', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimelineWeek',
      slotDuration: { days: 1 },
      slotHeaderFormat: [{ day: 'numeric', month: 'numeric' }, { weekday: 'short' }],
    })
    await waitForSettle()

    const labels = getNavLinkLabels(calendar.el)
    expect(labels.map((rowLabels) => rowLabels.length)).toEqual([7, 7])
    expect(labels[1][0]).toBe('Go to April 2, 2023')
  })

  it('renders navLinks in a multi-month view', async () => {
    const calendar = initCalendar({ ...options, initialView: 'timelineTwoMonth' })
    await waitForSettle()

    const labels = getNavLinkLabels(calendar.el).flat()
    expect(labels).toContain('Go to April 3, 2023')
    expect(labels).toContain('Go to May 31, 2023')
  })

  // TODO: also test implied week navLinks
  it('renders navLinks even with a custom slotHeaderFormat function', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'timelineMonth',
      slotHeaderFormat: () => 'test',
    })
    await waitForSettle()

    const firstCellEl = getSlotHeaderRows(calendar.el)[0][0]
    expect(firstCellEl.textContent).toBe('test')
    expect(queryPart(firstCellEl, 'navLink')!.getAttribute('aria-label')).toBe('Go to April 1, 2023')
  })

  it('goes to the day view when a day navLink is clicked', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimelineWeek',
      headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth', // the views it can go to
      },
    })
    await waitForSettle()

    const navLinkEl = queryParts(calendar.el, 'navLink')
      .find((el) => el.getAttribute('aria-label') === 'Go to April 4, 2023')!
    await userEvent.click(navLinkEl) // scrolls the wide day header into view
    await waitForSettle()

    expect(calendar.view.type).toBe('resourceTimelineDay')
    expect(calendar.view.currentStart.toISOString()).toBe('2023-04-04T00:00:00.000Z')
  })
})
