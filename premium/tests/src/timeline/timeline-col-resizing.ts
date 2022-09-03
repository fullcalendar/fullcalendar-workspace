import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline column resizing', () => { // better renamed to 'sizing'
  pushOptions({
    resourceAreaWidth: 230,
    initialView: 'resourceTimelineDay',
    resourceAreaColumns: [
      {
        headerContent: 'Room',
        field: 'title',
      },
      {
        headerContent: 'Occupancy',
        field: 'occupancy',
      },
    ],
    resources: [
      { id: 'a', occupancy: 40, building: '460 Bryant', title: 'Auditorium A' },
      { id: 'b', occupancy: 40, building: '460 Bryant', title: 'Auditorium B', eventColor: 'green' },
    ],
  })

  it('works with resourceGroupField', (done) => {
    let calendar = initCalendar({
      resourceGroupField: 'building',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let dataHeaderWrapper = viewWrapper.dataHeader
    let dataGridWrapper = viewWrapper.dataGrid

    function expectColWidthsToMatch() {
      let headCellWidths = getHeadCellWidths(dataHeaderWrapper)
      let bodyCellWidths = getBodyCellWidths(dataGridWrapper)

      expect(headCellWidths.length).toBe(2)
      expect(bodyCellWidths.length).toBe(2)
      expect(headCellWidths).toEqual(bodyCellWidths)
    }

    expectColWidthsToMatch()

    $(dataHeaderWrapper.getColResizerEls()[0]).simulate('drag', {
      dx: 20,
      callback() {
        expectColWidthsToMatch()
        done()
      },
    })
  })

  it('is affected by resourceColumn[].width settings', () => {
    let calendar = initCalendar()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let dataHeaderWrapper = viewWrapper.dataHeader
    let dataGridWrapper = viewWrapper.dataGrid

    let initialHeadWidths = getHeadCellWidths(dataHeaderWrapper)

    calendar.setOption('resourceAreaColumns', [
      {
        headerContent: 'Room',
        field: 'title',
        width: 350,
      },
      {
        headerContent: 'Occupancy',
        field: 'occupancy',
        width: 50,
      },
    ])

    let updatedHeadWidths = getHeadCellWidths(dataHeaderWrapper)

    // *any* sort of change? easier to do this than guess how tables distribute width
    expect(updatedHeadWidths).not.toEqual(initialHeadWidths)
    expect(updatedHeadWidths).toEqual(getBodyCellWidths(dataGridWrapper)) // they are in sync?
  })

  function getHeadCellWidths(dataHeaderWrapper) {
    return dataHeaderWrapper.getCellEls().map((el) => el.offsetWidth)
  }

  function getBodyCellWidths(dataGridWrapper) {
    return dataGridWrapper.getResourceCellEls('a').map((el) => el.offsetWidth)
  }
})
