
describe 'vresource resource rerendering', ->
	pushOptions
		defaultView: 'agendaDay'
		resources: [
			{ id: 'a', title: 'Auditorium A' }
			{ id: 'b', title: 'Auditorium B' }
			{ id: 'c', title: 'Auditorium C' }
		]

	it 'adjusts to removeResource', ->
		initCalendar()
		expect(getOrderedResourceIds()).toEqual([ 'a', 'b', 'c' ])
		currentCalendar.removeResource('a')
		expect(getOrderedResourceIds()).toEqual([ 'b', 'c' ])

	it 'adjusts to addResource', ->
		initCalendar()
		expect(getOrderedResourceIds()).toEqual([ 'a', 'b', 'c' ])
		currentCalendar.addResource
			id: 'd'
			title: 'Auditorium D'
		expect(getOrderedResourceIds()).toEqual([ 'a', 'b', 'c', 'd' ])

	# TODO: consolidate. also in resourceOrder
	getOrderedResourceIds = ->
		$('th.fc-resource-cell').map (i, node) ->
				$(node).data('resource-id')
			.get()
