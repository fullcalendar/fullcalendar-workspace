
describe 'removeResource', ->
	pushOptions
		resources: [
			{ id: 'a', title: 'a' }
			{ id: 'b', title: 'b' }
			{ id: 'c', title: 'c' }
		]

	describeOptions 'defaultView', {
		'when in timeline view': 'timelineDay'
		'when in agenda view': 'agendaDay'
	}, (viewName) ->

		getResourceIds =
			if viewName == 'timelineDay'
				getTimelineResourceIds
			else
				getTimeGridResourceIds

		it 'works when called quick succession', ->
			initCalendar()
			expect(getResourceIds()).toEqual([ 'a', 'b', 'c' ])

			currentCalendar.removeResource('a')
			expect(getResourceIds()).toEqual([ 'b', 'c' ])

			currentCalendar.removeResource('b')
			expect(getResourceIds()).toEqual([ 'c' ])

			currentCalendar.removeResource('c')
			expect(getResourceIds()).toEqual([])
