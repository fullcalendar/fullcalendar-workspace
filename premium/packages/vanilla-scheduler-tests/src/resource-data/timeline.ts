import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { Calendar, CalendarOptions } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryPart } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { createHeldFetch } from '../lib/fetching'
import {
  getResourceAreaRows, getResourceCells, getResourceIds, getResourceLane, getResourceLanes, getText, getTimeScroller,
} from '../lib/models/timeline-layout'

/*
The nearest ancestor that scrolls vertically.
*/
function getVerticalScroller(el: HTMLElement): HTMLElement {
  for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const { overflowY } = getComputedStyle(ancestor)

    if (overflowY === 'auto' || overflowY === 'scroll') {
      return ancestor
    }
  }
  throw new Error('No vertical scroller')
}

function getLaneResourceIds(root: HTMLElement): string[] {
  return getResourceLanes(root).map((el) => el.getAttribute('data-resource-id')!)
}

function buildResources(count: number, titleSuffix = '') {
  return Array.from({ length: count }, (_, i) => ({ id: `r${i}`, title: `resource ${i}${titleSuffix}` }))
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

describe('resource data in resource timeline', () => {
  it.each([
    [0, 'ltr'],
    [1, 'ltr'],
    [0, 'rtl'],
    [1, 'rtl'],
  ] as const)('settles with %s resources at midnight in %s', async (resourceCount, direction) => {
    const calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      initialDate: '2015-08-07',
      virtualization: true,
      scrollTime: '00:00',
      direction,
      resources: buildResources(resourceCount),
    })
    await waitForSettle()

    const mutations: MutationRecord[] = []
    const observer = new MutationObserver((records) => mutations.push(...records))
    observer.observe(calendar.el, { attributes: true, childList: true, characterData: true, subtree: true })
    try {
      for (let i = 0; i < 5; i++) {
        await nextFrame()
      }
      expect([...mutations, ...observer.takeRecords()]).toEqual([])
    } finally {
      observer.disconnect()
    }
  })

  describe('adding and removing resources', () => {
    const options: CalendarOptions = {
      initialView: 'resourceTimelineDay',
      initialDate: '2016-05-31',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' },
      ],
    }

    it('renders a removed resource\'s row and lane no more', async () => {
      const calendar = initCalendar(options)
      await waitForSettle()
      expect(getResourceIds(calendar.el)).toEqual(['a', 'b', 'c'])

      calendar.getResourceById('a')!.remove()
      await waitForSettle()

      expect(getResourceIds(calendar.el)).toEqual(['b', 'c'])
      expect(getLaneResourceIds(calendar.el)).toEqual(['b', 'c'])
    })

    // https://github.com/fullcalendar/fullcalendar-scheduler/issues/179
    it('renders an added resource, including after switching views', async () => {
      const calendar = initCalendar(options)
      await waitForSettle()

      calendar.changeView('resourceTimelineWeek')
      await waitForSettle()
      expect(getLaneResourceIds(calendar.el)).toEqual(['a', 'b', 'c'])

      calendar.addResource({ id: 'd', title: 'Auditorium D' })
      await waitForSettle()
      expect(getResourceIds(calendar.el)).toEqual(['a', 'b', 'c', 'd'])
      expect(getLaneResourceIds(calendar.el)).toEqual(['a', 'b', 'c', 'd'])

      calendar.changeView('resourceTimelineDay')
      await waitForSettle()
      expect(getLaneResourceIds(calendar.el)).toEqual(['a', 'b', 'c', 'd'])
    })

    it('renders an added row as tall as its lane, and scrolls to it', async () => {
      const calendar = initCalendar({ ...options, resources: buildResources(50) })
      await waitForSettle()
      const areaScrollerEl = getVerticalScroller(getResourceCells(calendar.el, 'r0')[0])
      expect(areaScrollerEl.scrollTop).toBe(0)

      calendar.addResource({ id: 'z', title: 'last resource' }, true) // sorts last by id
      await waitForSettle()

      // the bottom border is on the cell in the resource area, but on the row in the lanes
      expect(Math.abs(getResourceCells(calendar.el, 'z')[0].offsetHeight - getResourceLane(calendar.el, 'z').offsetHeight))
        .toBeLessThanOrEqual(1)
      const maxScroll = areaScrollerEl.scrollHeight - areaScrollerEl.clientHeight
      expect(maxScroll).toBeGreaterThan(0)
      expect(Math.abs(maxScroll - areaScrollerEl.scrollTop)).toBeLessThan(1)
    })

    describe('as a child of another', () => {
      it('renders it under the parent when the parent is expanded', async () => {
        const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'a' }], resourcesInitiallyExpanded: true })
        await waitForSettle()

        calendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })
        await waitForSettle()

        const rows = getResourceAreaRows(calendar.el)
        expect(rows.map((row) => row.resourceId)).toEqual(['a', 'a1'])
        expect(queryPart(rows[0].el, 'resourceExpander')).not.toBeNull()
        // one level of indentation, plus the space for an expander
        const parentIndentWidth = queryPart(rows[0].el, 'resourceIndent')!.getBoundingClientRect().width
        expect(queryPart(rows[1].el, 'resourceIndent')!.getBoundingClientRect().width).toBe(parentIndentWidth * 2)
      })

      it('doesn\'t render it while the parent is collapsed', async () => {
        const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'a' }], resourcesInitiallyExpanded: false })
        await waitForSettle()

        calendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })
        await waitForSettle()

        expect(calendar.getResourceById('a1')!.getParent()!.id).toBe('a')
        expect(getResourceIds(calendar.el)).toEqual(['a'])
      })
    })

    // https://github.com/fullcalendar/fullcalendar/issues/8072
    it.each([
      ['the default height', undefined],
      ['height:auto', 'auto'],
    ])('renders nested resources added with scrollTo, when virtualized, with %s', async (_desc, height) => {
      const calendar = initCalendar({
        virtualization: true,
        nowIndicator: true,
        height,
        initialView: 'resourceTimelineYearOfDays',
        views: {
          resourceTimelineYearOfDays: {
            type: 'resourceTimeline',
            slotDuration: { days: 1 },
            visibleRange: { start: '2026-01-01', end: '2027-01-01' },
          },
        },
        resources: [
          { id: 'a', title: 'A', parentId: '' },
          { id: 'b', title: 'B', parentId: 'a' },
          { id: 'c', title: 'C', parentId: 'b' },
          { id: 'd', title: 'D', parentId: 'c' },
        ],
      })
      await waitForSettle()
      expect(getResourceIds(calendar.el)).toEqual(['a', 'b', 'c', 'd'])

      calendar.addResource({ id: 'e', title: 'E', parentId: 'b' }, true)
      calendar.addResource({ id: 'f', title: 'F', parentId: 'e' }, true)
      await waitForSettle()

      expect(getResourceIds(calendar.el)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    })
  })

  /*
  A filter change in an app typically removes all resources and re-adds the matching ones.
  Where the rows end up depends on the scroll position recorded when scrolling ends, after the
  scroll-end debounce (500ms). The library doesn't make that wait configurable, so these tests fake
  timeouts while it runs out.
  */
  describe('replacing all resources when virtualized', () => {
    const options: CalendarOptions = {
      initialView: 'resourceTimelineDay',
      initialDate: '2016-05-31',
      virtualization: true,
      height: 400,
      resourceOrder: 'id',
    }

    function buildIds(start: number, end: number): string[] {
      return Array.from({ length: end - start }, (_, i) => 'r' + String(start + i).padStart(3, '0'))
    }

    // row heights vary by position, so rows change height when other rows are filtered out
    function buildResourcesWithEvents(ids: string[]) {
      const resources = ids.map((id) => ({ id, title: id }))
      const events = ids.flatMap((id, i) => Array.from({ length: (i % 4) + 1 }, () => (
        { resourceId: id, start: '2016-05-31T01:00:00', end: '2016-05-31T05:00:00' }
      )))
      return { resources, events }
    }

    function fakeTimeouts(): void {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      onTestFinished(() => {
        vi.useRealTimers()
      })
    }

    /*
    With faked timeouts: lets a frame pass (dispatching scroll events and running frame work), then
    runs the timeouts due within `ms`. Repeats so work scheduled by that work runs too.
    */
    async function passTime(ms: number): Promise<void> {
      for (let i = 0; i < 3; i++) {
        await nextFrame()
        vi.advanceTimersByTime(ms)
      }
    }

    async function scrollAndEnd(scrollerEl: HTMLElement, top: number): Promise<void> {
      fakeTimeouts()
      scrollerEl.scrollTop = top
      await passTime(1000) // past the scroll-end debounce
      vi.useRealTimers()
      await waitForSettle()
    }

    function removeAll(calendar: Calendar): void {
      calendar.batchRendering(() => {
        calendar.getResources().forEach((resource) => resource.remove())
        calendar.removeAllEventSources()
      })
    }

    function addAll(calendar: Calendar, { resources, events }: ReturnType<typeof buildResourcesWithEvents>, scrollTo: boolean): void {
      calendar.batchRendering(() => {
        resources.forEach((resource) => calendar.addResource(resource, scrollTo))
      })
      calendar.addEventSource(events)
    }

    async function replaceResources(calendar: Calendar, data: ReturnType<typeof buildResourcesWithEvents>, scrollTo: boolean) {
      removeAll(calendar)
      await waitForSettle()
      addAll(calendar, data, scrollTo)
      await waitForSettle()
    }

    function getScroller(calendar: Calendar): HTMLElement {
      return getVerticalScroller(getResourceCells(calendar.el, getResourceIds(calendar.el)[0])[0])
    }

    function getVisibleResourceIds(calendar: Calendar): string[] {
      const scrollerRect = getScroller(calendar).getBoundingClientRect()
      return getResourceAreaRows(calendar.el)
        .filter((row) => {
          const rect = row.el.getBoundingClientRect()
          return rect.bottom > scrollerRect.top && rect.top < scrollerRect.bottom
        })
        .map((row) => row.resourceId!)
    }

    function expectRowAtTop(calendar: Calendar, resourceId: string): void {
      const scrollerEl = getScroller(calendar)
      const cellEl = getResourceCells(calendar.el, resourceId)[0]

      expect(scrollerEl.scrollTop).toBe(0)
      expect(cellEl).toBeDefined()
      expect(Math.abs(cellEl.getBoundingClientRect().top - scrollerEl.getBoundingClientRect().top)).toBeLessThanOrEqual(1)
    }

    it('renders the rows in view after re-adding them with scrollTo', async () => {
      const calendar = initCalendar({ ...options, ...buildResourcesWithEvents(buildIds(0, 20)) })
      await waitForSettle()

      await replaceResources(calendar, buildResourcesWithEvents(buildIds(0, 90)), true) // scrolls to the last
      await scrollAndEnd(getTimeScroller(calendar.el), 0)
      expect(getVisibleResourceIds(calendar)).not.toContain('r089')

      // row heights are already known this time, so no height change triggers a rerender
      await replaceResources(calendar, buildResourcesWithEvents(buildIds(0, 90)), true)
      expect(getVisibleResourceIds(calendar)).toContain('r089')
    })

    // the new first row is either an existing row (r003) or a brand-new one (a000)
    it.each([
      ['r003', 'near the top', [20], buildIds(3, 90)],
      ['a000', 'near the top', [20], ['a000', ...buildIds(3, 90)]],
      ['r003', 'to the top', [300, 0], buildIds(3, 90)],
      ['a000', 'to the top', [300, 0], ['a000', ...buildIds(3, 90)]],
    ])('shows the new first row (%s) when re-added while scrolled %s', async (firstId, _desc, scrollTops, newIds) => {
      const calendar = initCalendar({ ...options, ...buildResourcesWithEvents(buildIds(0, 90)) })
      await waitForSettle()
      for (const scrollTop of scrollTops) {
        await scrollAndEnd(getTimeScroller(calendar.el), scrollTop)
      }

      await replaceResources(calendar, buildResourcesWithEvents(newIds), false)
      expect(getResourceIds(calendar.el)[0]).toBe(firstId)
      expectRowAtTop(calendar, firstId)
    })

    // the first row's height changes while the scroll position is stale
    it.each([
      ['shrinks', 0],
      ['grows', 6],
    ])('shows the new first row when re-added mid-scroll, when the first row %s', async (_desc, extraEventCount) => {
      const calendar = initCalendar({ ...options, ...buildResourcesWithEvents(buildIds(0, 90)) })
      await waitForSettle()
      const scrollerEl = getTimeScroller(calendar.el)
      await scrollAndEnd(scrollerEl, 300)
      await scrollAndEnd(scrollerEl, 0)

      fakeTimeouts()
      scrollerEl.scrollTop = 200
      await passTime(100) // well before the scroll ends

      const data = buildResourcesWithEvents(buildIds(3, 90))
      for (let i = 0; i < extraEventCount; i++) {
        data.events.push({ resourceId: 'r003', start: '2016-05-31T01:00:00', end: '2016-05-31T05:00:00' })
      }
      removeAll(calendar)

      // Forcing layout clamps the scroll back to where the scroll started, but the scroll event only
      // fires after the re-added rows change height
      expect(scrollerEl.scrollTop).toBe(0)

      addAll(calendar, data, false)
      await passTime(1000) // past the scroll-end debounce
      vi.useRealTimers()
      await waitForSettle()

      expectRowAtTop(calendar, 'r003')
    })
  })

  describe('refetchResources', () => {
    const options: CalendarOptions = {
      now: '2015-08-07',
      scrollTime: '00:00',
      initialView: 'resourceTimelineDay',
    }
    const events = [
      { id: '1', resourceId: 'r1', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00' },
      { id: '2', resourceId: 'r2', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00' },
      { id: '3', resourceId: 'r3', start: '2015-08-06', end: '2015-08-08' },
    ]

    it('renders the refetched resources', async () => {
      const resourceFetch = createHeldFetch((callNum) => buildResources(26, `-${callNum}`))
      const calendar = initCalendar({ ...options, resources: resourceFetch.fetch, events })
      await resourceFetch.releaseAll()
      expect(getText(getResourceCells(calendar.el, 'r4')[0])).toBe('resource 4-1')

      calendar.refetchResources()
      await resourceFetch.releaseAll()
      expect(getText(getResourceCells(calendar.el, 'r4')[0])).toBe('resource 4-2')
    })

    it.each([
      ['', {}],
      [' when virtualized', { virtualization: true }],
    ])('keeps the scroll position%s', async (_desc, moreOptions) => {
      const resourceFetch = createHeldFetch(() => buildResources(26))
      const calendar = initCalendar({ ...options, ...moreOptions, resources: resourceFetch.fetch, events })
      await resourceFetch.releaseAll()

      const scrollerEl = getTimeScroller(calendar.el)
      scrollerEl.scrollTop = 100
      scrollerEl.scrollLeft = 50
      await waitForSettle()
      expect([scrollerEl.scrollTop, scrollerEl.scrollLeft]).toEqual([100, 50])

      calendar.refetchResources()
      await waitForSettle()
      expect(resourceFetch.heldCallNums).toEqual([2])
      await resourceFetch.releaseAll()

      expect(getTimeScroller(calendar.el)).toBe(scrollerEl)
      expect([scrollerEl.scrollTop, scrollerEl.scrollLeft]).toEqual([100, 50])
    })
  })
})
