import { waitTimeout, ignoreResizeObserverLoops } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline addResource', () => {
  pushOptions({
    initialDate: '2016-05-31',
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/179
  it('works when switching views', async () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' },
      ],
    })

    function getResourceIds() {
      return new ResourceTimelineViewWrapper(calendar).timelineGrid.getResourceIds()
    }

    await ignoreResizeObserverLoops(async () => {
      await waitTimeout()
      expect(getResourceIds()).toEqual(['a', 'b', 'c'])

      calendar.changeView('resourceTimelineWeek')
      await waitTimeout()
      expect(getResourceIds()).toEqual(['a', 'b', 'c'])

      calendar.addResource({ id: 'd', title: 'Auditorium D' })
      await waitTimeout()
      expect(getResourceIds()).toEqual(['a', 'b', 'c', 'd'])

      calendar.changeView('resourceTimelineDay')
      await waitTimeout()
      expect(getResourceIds()).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  it('renders new row with correct height', async () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: buildResources(50),
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let dataGridWrapper = viewWrapper.dataGrid
    let timelineGridWrapper = viewWrapper.timelineGrid

    await waitTimeout()
    calendar.addResource({ id: 'last', title: 'last resource' }, true)
    await waitTimeout()

    const spreadsheetCellEl = dataGridWrapper.getResourceCellEl('last')
    const spreadsheetRowHeight = spreadsheetCellEl.offsetHeight
    const timeCellEl = timelineGridWrapper.getResourceLaneEl('last')
    const timeRowHeight = timeCellEl.offsetHeight

    expect(spreadsheetRowHeight).toEqual(timeRowHeight)
  })

  it('scrolls correctly with scroll param', async () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: buildResources(50),
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    await waitTimeout()
    calendar.addResource({ id: 'last', title: 'last resource' }, true)
    await waitTimeout()

    const spreadsheetScrollerEl = viewWrapper.getDataGridBodyEl()
    const maxScroll = spreadsheetScrollerEl.scrollHeight - spreadsheetScrollerEl.clientHeight
    const currentScroll = spreadsheetScrollerEl.scrollTop
    expect(Math.abs(maxScroll - currentScroll)).toBeLessThan(1)
  })

  describe('when adding resource as child of another', () => {
    pushOptions({
      initialView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'a' },
      ],
    })

    it('correctly adds when parent expanded', () => {
      let calendar = initCalendar({
        resourcesInitiallyExpanded: true,
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      calendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })

      // expanded
      expect(dataGridWrapper.isRowExpanded('a')).toBe(true)

      // one level of indentation, and one space where an arrow might be
      expect(dataGridWrapper.getRowIndentationWidth('a1')).toBe(
        dataGridWrapper.getRowIndentationWidth('a') * 2,
      )
    })

    it('correctly adds when parent contracted', () => {
      let calendar = initCalendar({
        resourcesInitiallyExpanded: false,
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      calendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })

      expect(dataGridWrapper.isRowExpanded('a')).toBe(false)
      expect(dataGridWrapper.getResourceCellEl('a1')).toBeFalsy()
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/8072
  describe('when adding resources with scrollTo with virtualization', () => {
    describeValues({
      'when height undefined': undefined,
      'when height auto': 'auto',
    }, (height) => {
      it('positions resources correctly', async () => {
        await ignoreResizeObserverLoops(async () => {
          let calendar = initCalendar({
            virtualization: true,
            nowIndicator: true,
            height,
            initialView: 'resourceTimelineTest',
            views: {
              resourceTimelineTest: {
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
          await waitTimeout()

          let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid
          expect(dataGridWrapper.getResourceIds()).toEqual(['a', 'b', 'c', 'd'])

          calendar.addResource({ id: 'e', title: 'E', parentId: 'b' }, /* scrollTo = */ true)
          calendar.addResource({ id: 'f', title: 'F', parentId: 'e' }, /* scrollTo = */ true)
          await waitTimeout()

          expect(dataGridWrapper.getResourceIds()).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
        })
      })
    })
  })

  // A filter change in an app typically removes all resources and re-adds the matching ones
  describe('when replacing all resources with virtualization', () => {
    pushOptions({
      initialView: 'resourceTimelineDay',
      virtualization: true,
      height: 400,
      resourceOrder: 'id',
    })

    it('renders rows in view after re-adding them with scrollTo', async () => {
      let calendar = initCalendar(buildResourcesWithEvents(buildIds(0, 20)))
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)

      await ignoreResizeObserverLoops(async () => {
        await waitTimeout()
        await replaceResources(calendar, buildResourcesWithEvents(buildIds(0, 90)), true) // scrolls to last
        viewWrapper.getTimeBodyEl().scrollTop = 0
        await waitTimeout(SCROLL_END_WAIT)

        // row heights are already known this time, so no height change triggers a rerender
        await replaceResources(calendar, buildResourcesWithEvents(buildIds(0, 90)), true)
        expect(getVisibleResourceIds(calendar)).toContain('r089')
      })
    })

    it('shows the new first row when re-added while scrolled near the top', async () => {
      let calendar = initCalendar(buildResourcesWithEvents(buildIds(0, 90)))
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)

      await ignoreResizeObserverLoops(async () => {
        await waitTimeout()
        viewWrapper.getTimeBodyEl().scrollTop = 20
        await waitTimeout(SCROLL_END_WAIT)

        await replaceResources(calendar, buildResourcesWithEvents(buildIds(3, 90)), false)
        expectRowAtTop(calendar, 'r003')
      })
    })

    it('shows the new first row when re-added while scrolled to the top', async () => {
      let calendar = initCalendar(buildResourcesWithEvents(buildIds(0, 90)))
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)

      await ignoreResizeObserverLoops(async () => {
        await waitTimeout()
        viewWrapper.getTimeBodyEl().scrollTop = 300
        await waitTimeout(SCROLL_END_WAIT)
        viewWrapper.getTimeBodyEl().scrollTop = 0
        await waitTimeout(SCROLL_END_WAIT)

        await replaceResources(calendar, buildResourcesWithEvents(['a000', ...buildIds(0, 90)]), false)
        expectRowAtTop(calendar, 'a000')
      })
    })

    // the first row's height changes while the scroll position is stale
    describeValues({
      'when the first row shrinks': 0,
      'when the first row grows': 6,
    }, (extraEventCnt) => {
      it('shows the new first row when re-added mid-scroll', async () => {
        let calendar = initCalendar(buildResourcesWithEvents(buildIds(0, 90)))
        let viewWrapper = new ResourceTimelineViewWrapper(calendar)
        let scrollerEl = viewWrapper.getTimeBodyEl()

        await ignoreResizeObserverLoops(async () => {
          await waitTimeout()
          scrollerEl.scrollTop = 300
          await waitTimeout(SCROLL_END_WAIT)
          scrollerEl.scrollTop = 0
          await waitTimeout(SCROLL_END_WAIT)
          scrollerEl.scrollTop = 200
          await waitTimeout() // well before the scroll ends, 500ms after its last scroll event

          let { resources, events } = buildResourcesWithEvents(buildIds(3, 90))
          for (let i = 0; i < extraEventCnt; i += 1) {
            events.push({ resourceId: 'r003', start: '2016-05-31T01:00:00', end: '2016-05-31T05:00:00' })
          }

          calendar.batchRendering(() => {
            calendar.getResources().forEach((resource) => resource.remove())
            calendar.removeAllEventSources()
          })

          // Forcing layout clamps the scroll back to where the scroll started, but the scroll
          // event only fires after the re-added rows change height
          expect(scrollerEl.scrollTop).toBe(0)

          calendar.batchRendering(() => {
            resources.forEach((resource) => calendar.addResource(resource, false))
          })
          calendar.addEventSource(events)
          await waitTimeout(SCROLL_END_WAIT)

          expectRowAtTop(calendar, 'r003')
        })
      })
    })

    const SCROLL_END_WAIT = 700

    function buildIds(start, end) {
      let ids = []

      for (let i = start; i < end; i += 1) {
        ids.push('r' + String(i).padStart(3, '0'))
      }

      return ids
    }

    // row heights vary by position, so rows change height when other rows are filtered out
    function buildResourcesWithEvents(ids) {
      let resources = []
      let events = []

      ids.forEach((id, i) => {
        resources.push({ id, title: id })

        for (let j = 0; j <= i % 4; j += 1) {
          events.push({ resourceId: id, start: '2016-05-31T01:00:00', end: '2016-05-31T05:00:00' })
        }
      })

      return { resources, events }
    }

    async function replaceResources(calendar, { resources, events }, scrollTo) {
      calendar.batchRendering(() => {
        calendar.getResources().forEach((resource) => resource.remove())
        calendar.removeAllEventSources()
      })
      await waitTimeout()

      calendar.batchRendering(() => {
        resources.forEach((resource) => calendar.addResource(resource, scrollTo))
      })
      calendar.addEventSource(events)
      await waitTimeout()
    }

    function getVisibleResourceIds(calendar) {
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)
      let scrollerRect = viewWrapper.getDataGridBodyEl().getBoundingClientRect()

      return viewWrapper.dataGrid.getResourceCellEls(null)
        .filter((cellEl) => {
          let cellRect = cellEl.getBoundingClientRect()
          return cellRect.bottom > scrollerRect.top && cellRect.top < scrollerRect.bottom
        })
        .map((cellEl) => cellEl.getAttribute('data-resource-id'))
    }

    function expectRowAtTop(calendar, resourceId) {
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)
      let scrollerEl = viewWrapper.getDataGridBodyEl()
      let cellEl = viewWrapper.dataGrid.getResourceCellEl(resourceId)

      expect(scrollerEl.scrollTop).toBe(0)
      expect(cellEl).toBeTruthy()

      if (cellEl) {
        expect(Math.abs(cellEl.getBoundingClientRect().top - scrollerEl.getBoundingClientRect().top))
          .toBeLessThanOrEqual(1)
      }
    }
  })

  function buildResources(cnt) {
    let resources = []

    for (let i = 0; i < cnt; i += 1) {
      resources.push({ title: `resource ${i}` })
    }

    return resources
  }
})
