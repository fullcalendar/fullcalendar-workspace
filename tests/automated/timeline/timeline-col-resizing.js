
describe('timeline column resizing', function() { // better renamed to 'sizing'
  pushOptions({
    resourceAreaWidth: 230,
    defaultView: 'resourceTimelineDay',
    resourceColumns: [
      {
        labelText: 'Room',
        field: 'title'
      },
      {
        labelText: 'Occupancy',
        field: 'occupancy'
      }
    ],
    resources: [
      { id: 'a', occupancy: 40, building: '460 Bryant', title: 'Auditorium A' },
      { id: 'b', occupancy: 40, building: '460 Bryant', title: 'Auditorium B', eventColor: 'green' }
    ]
  })


  it('works with resourceGroupField', function(done) {
    initCalendar({
      resourceGroupField: 'building'
    })

    function expectColWidthsToMatch() {
      const headCellWidths = getHeadCellWidths()
      const bodyCellWidths = getBodyCellWidths()
      expect(headCellWidths.length).toBe(2)
      expect(bodyCellWidths.length).toBe(2)
      expect(headCellWidths).toEqual(bodyCellWidths)
    }

    expectColWidthsToMatch()

    $('.fc-head .fc-resource-area .fc-col-resizer:first').simulate('drag', {
      dx: 20,
      callback() {
        expectColWidthsToMatch()
        done()
      }
    })
  })


  it('is affected by resourceColumng[].width settings', function() {
    initCalendar()
    let initialHeadWidths = getHeadCellWidths()

    currentCalendar.setOption('resourceColumns', [
      {
        labelText: 'Room',
        field: 'title',
        width: 350
      },
      {
        labelText: 'Occupancy',
        field: 'occupancy',
        width: 50
      }
    ])

    // *any* sort of change? easier to do this than guess how tables distribute width
    let updatedHeadWidths = getHeadCellWidths()
    expect(updatedHeadWidths).not.toEqual(initialHeadWidths)
    expect(updatedHeadWidths).toEqual(getBodyCellWidths()) // they are in sync?
  })


  function getHeadCellWidths() { // rounded (inadvertently by jquery)
    return $('.fc-head .fc-resource-area th').get().map(function(el) {
      return $(el).width()
    })
  }

  function getBodyCellWidths() { // rounded (inadvertently by jquery)
    return $('.fc-body .fc-resource-area tr[data-resource-id="a"] td').get().map(function(el) {
      return $(el).width()
    })
  }

})
