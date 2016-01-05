
describe 'timeline column grouping', ->

	it 'renders row heights correctly when grouping columns', ->
		initCalendar
			defaultView: 'timelineDay'
			resourceColumns: [
				{
					group: true,
					labelText: 'col1'
					field: 'col1'
				},
				{
					group: true,
					labelText: 'col2'
					field: 'col2'
				},
				{
					labelText: 'col3'
					field: 'col3'
				}
			],
			resources: [
				{ id: 'a', col1: 'Group A', col2: 'Group 2', col3: 'One' }
				{ id: 'b', col1: 'Group A', col2: 'Group 2', col3: 'Two' }
				{ id: 'c', col1: 'Group A', col2: 'Group 2', col3: 'Three' }
				{ id: 'd', col1: 'Group B', col2: 'Group 1', col3: 'One' }
				{ id: 'e', col1: 'Group B', col2: 'Group 2', col3: 'One' }
				{ id: 'f', col1: 'Group C', col2: 'Group 1', col3: 'One' }
			]
		resourceTrs = $('.fc-body .fc-resource-area tr[data-resource-id]')
		eventTrs = $('.fc-body .fc-time-area tr[data-resource-id]')
		expect(resourceTrs.length).toBe(6)
		expect(eventTrs.length).toBe(6)
		for resourceTr, i in resourceTrs
			eventTr = eventTrs[i]
			resourceTd = $(resourceTr).find('td').filter ->
				parseInt($(this).attr('rowspan') or 1) == 1
			eventTd = $(eventTr).find('td')
			expect(resourceTd.height()).toBe(eventTd.height())
