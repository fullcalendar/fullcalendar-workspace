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

  function buildResources(cnt) {
    let resources = []

    for (let i = 0; i < cnt; i += 1) {
      resources.push({ title: `resource ${i}` })
    }

    return resources
  }
})
