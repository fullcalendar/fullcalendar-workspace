import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline addResource', () => {
  pushOptions({
    initialDate: '2016-05-31',
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/179
  it('works when switching views', () => {
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

    expect(getResourceIds()).toEqual(['a', 'b', 'c'])

    currentCalendar.changeView('resourceTimelineWeek')
    expect(getResourceIds()).toEqual(['a', 'b', 'c'])

    currentCalendar.addResource({ id: 'd', title: 'Auditorium D' })
    expect(getResourceIds()).toEqual(['a', 'b', 'c', 'd'])

    currentCalendar.changeView('resourceTimelineDay')
    expect(getResourceIds()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('renders new row with correct height', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: buildResources(50),
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let dataGridWrapper = viewWrapper.dataGrid
    let timelineGridWrapper = viewWrapper.timelineGrid

    calendar.addResource({ id: 'last', title: 'last resource' }, true)

    const spreadsheetCellEl = dataGridWrapper.getResourceCellEl('last')
    const spreadsheetRowHeight = spreadsheetCellEl.offsetHeight
    const timeCellEl = timelineGridWrapper.getResourceLaneEl('last')
    const timeRowHeight = timeCellEl.offsetHeight

    expect(spreadsheetRowHeight).toEqual(timeRowHeight)
  })

  it('scrolls correctly with scroll param', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: buildResources(50),
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    currentCalendar.addResource({ id: 'last', title: 'last resource' }, true)

    const spreadsheetScrollerEl = viewWrapper.getDataScrollEl()
    const maxScroll = spreadsheetScrollerEl.scrollHeight - spreadsheetScrollerEl.clientHeight
    const currentScroll = spreadsheetScrollerEl.scrollTop
    expect(maxScroll).toBe(currentScroll)
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

      currentCalendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })

      // expanded
      expect(dataGridWrapper.isRowExpanded('a')).toBe(true)

      // one level of indentation, and one space where an arrow might be
      expect(dataGridWrapper.getRowIndentation('a1')).toBe(2)
    })

    it('correctly adds when parent contracted', () => {
      let calendar = initCalendar({
        resourcesInitiallyExpanded: false,
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      currentCalendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })

      expect(dataGridWrapper.isRowExpanded('a')).toBe(false)
      expect(dataGridWrapper.getResourceCellEl('a1')).toBeFalsy()
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
