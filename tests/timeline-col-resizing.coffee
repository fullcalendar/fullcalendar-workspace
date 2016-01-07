
describe 'timeline column resizing', ->

	it 'works with resourceGroupField', (done) ->
		initCalendar
			resourceAreaWidth: 230
			defaultView: 'timelineDay'
			resourceColumns: [
				{
					labelText: 'Room'
					field: 'title'
				},
				{
					labelText: 'Occupancy'
					field: 'occupancy'
				}
			]
			resourceGroupField: 'building',  
			resources: [
				{ id: 'a', occupancy: 40, building: '460 Bryant', title: 'Auditorium A' }
				{ id: 'b', occupancy: 40, building: '460 Bryant', title: 'Auditorium B', eventColor: 'green' }
			]

		expectColWidthsToMatch = ->
			headCells = $('.fc-head .fc-resource-area th')
			bodyCells = $('.fc-body .fc-resource-area tr[data-resource-id="a"] td')
			expect(headCells.length).toBe(2)
			expect(bodyCells.length).toBe(2)
			for headCell, i in headCells
				bodyCell = bodyCells[i]
				expect($(headCell).width()).toBe($(bodyCell).width())
		expectColWidthsToMatch()

		$('.fc-head .fc-resource-area .fc-col-resizer:first').simulate 'drag',
			dx: 20
			callback: ->
				expectColWidthsToMatch()
				done()
