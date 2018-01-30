
describe('timeline column resizing', function() {

  it('works with resourceGroupField', function(done) {
    initCalendar({
      resourceAreaWidth: 230,
      defaultView: 'timelineDay',
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
      resourceGroupField: 'building',
      resources: [
        { id: 'a', occupancy: 40, building: '460 Bryant', title: 'Auditorium A' },
        { id: 'b', occupancy: 40, building: '460 Bryant', title: 'Auditorium B', eventColor: 'green' }
      ]
    })

    function expectColWidthsToMatch() {
      const headCells = $('.fc-head .fc-resource-area th')
      const bodyCells = $('.fc-body .fc-resource-area tr[data-resource-id="a"] td')
      expect(headCells.length).toBe(2)
      expect(bodyCells.length).toBe(2)

      for (let i = 0; i < headCells.length; i++) {
        const headCell = headCells[i]
        const bodyCell = bodyCells[i]
        expect($(headCell).width()).toBe($(bodyCell).width())
      }
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
})
