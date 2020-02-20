import ResourceTimelineViewWrapper from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline addResource', function() {
  pushOptions({
    defaultDate: '2016-05-31'
  })


  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/179
  it('works when switching views', function() {
    let calendar = initCalendar({
      defaultView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' }
      ]
    })

    function getResourceIds() {
      return new ResourceTimelineViewWrapper(calendar).timelineGrid.getResourceIds()
    }

    expect(getResourceIds()).toEqual([ 'a', 'b', 'c' ])

    currentCalendar.changeView('resourceTimelineWeek')
    expect(getResourceIds()).toEqual([ 'a', 'b', 'c' ])

    currentCalendar.addResource({ id: 'd', title: 'Auditorium D' })
    expect(getResourceIds()).toEqual([ 'a', 'b', 'c', 'd' ])

    currentCalendar.changeView('resourceTimelineDay')
    expect(getResourceIds()).toEqual([ 'a', 'b', 'c', 'd' ])
  })


  it('renders new row with correct height', function() {
    let calendar = initCalendar({
      defaultView: 'resourceTimelineDay',
      resources: buildResources(50)
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let dataGridWrapper = viewWrapper.dataGrid
    let timelineGridWrapper = viewWrapper.timelineGrid

    calendar.addResource({ id: 'last', title: 'last resource' }, true)

    const spreadsheetRowEl = dataGridWrapper.getResourceRowEl('last')
    const spreadsheetRowHeight = spreadsheetRowEl.offsetHeight
    const timeRowEl = timelineGridWrapper.getResourceRowEl('last')
    const timeRowHeight = timeRowEl.offsetHeight

    expect(spreadsheetRowHeight).toEqual(timeRowHeight)
  })


  it('scrolls correctly with scroll param', function() {
    let calendar = initCalendar({
      defaultView: 'resourceTimelineDay',
      resources: buildResources(50)
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    currentCalendar.addResource({ id: 'last', title: 'last resource' }, true)

    const spreadsheetScrollerEl = viewWrapper.getDataScrollEl()
    const maxScroll = spreadsheetScrollerEl.scrollHeight - spreadsheetScrollerEl.clientHeight
    const currentScroll = spreadsheetScrollerEl.scrollTop
    expect(maxScroll).toBe(currentScroll)
  })


  describe('when adding resource as child of another', function() {
    pushOptions({
      defaultView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'a' }
      ]
    })

    it('correctly adds when parent expanded', function() {
      let calendar = initCalendar({
        resourcesInitiallyExpanded: true
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      currentCalendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })

      // expanded
      expect(dataGridWrapper.isRowExpanded('a')).toBe(true)

      // one level of indentation, and one space where an arrow might be
      expect(dataGridWrapper.getRowIndentation('a1')).toBe(2)
    })

    it('correctly adds when parent contracted', function() {
      let calendar = initCalendar({
        resourcesInitiallyExpanded: false
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      currentCalendar.addResource({ id: 'a1', title: 'a1', parentId: 'a' })

      expect(dataGridWrapper.isRowExpanded('a')).toBe(false)
      expect(dataGridWrapper.getResourceRowEl('a1')).toBeFalsy()
    })
  })


  function buildResources(cnt) {
    var resources = []

    for (var i = 0; i < cnt; i++) {
      resources.push({ title: `resource ${i}` })
    }

    return resources
  }

})
