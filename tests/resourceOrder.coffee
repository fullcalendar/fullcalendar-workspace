
describe 'resourceOrder', ->

	describe 'when in agenda view', ->
		pushOptions
			defaultView: 'agendaDay'
			resources: [
				{ id: 'a', title: 'Auditorium A' }
				{ id: 'b', title: 'Auditorium B' }
				{ id: 'c', title: 'Auditorium C' }
				{ id: 'd', title: 'Auditorium D' }
				{ id: 'e', title: 'Auditorium E' }
				{ id: 'f', title: 'Auditorium F' }
				{ id: 'a2', title: 'Auditorium A2' }
				{ id: 'b2', title: 'Auditorium B2' }
				{ id: 'c2', title: 'Auditorium C2' }
				{ id: 'd2', title: 'Auditorium D2' }
				{ id: 'e2', title: 'Auditorium E2' }
				{ id: 'f2', title: 'Auditorium F2' }
			]

		it 'renders correct order when not defined and alpha collisions', ->
			initCalendar()
			expect(getOrderedResourceIds()).toEqual([
				'a', 'b', 'c', 'd', 'e', 'f', 'a2', 'b2', 'c2', 'd2', 'e2', 'f2'
			])

		it 'renders correct order when ordered by title', ->
			initCalendar
				resourceOrder: 'title'
			expect(getOrderedResourceIds()).toEqual([
				'a', 'a2', 'b', 'b2', 'c', 'c2', 'd', 'd2', 'e', 'e2', 'f', 'f2'
			])

		getOrderedResourceIds = ->
			$('th.fc-resource-cell').map (i, node) ->
					$(node).data('resource-id')
				.get()

	describe 'when in timeline view', ->
		pushOptions
			defaultView: 'timelineDay'
			resources: [
				{ id: 'a', title: 'Auditorium A' }
				{ id: 'b', title: 'Auditorium B' }
				{ id: 'c', title: 'Auditorium C' }
				{ id: 'd', title: 'Auditorium D' }
				{ id: 'e', title: 'Auditorium E' }
				{ id: 'f', title: 'Auditorium F' }
				{ id: 'a2', title: 'Auditorium A2' }
				{ id: 'b2', title: 'Auditorium B2' }
				{ id: 'c2', title: 'Auditorium C2' }
				{ id: 'd2', title: 'Auditorium D2' }
				{ id: 'e2', title: 'Auditorium E2' }
				{ id: 'f2', title: 'Auditorium F2' }
			]

		it 'renders correct order when not defined and alpha collisions', ->
			initCalendar()
			expect(getOrderedResourceIds()).toEqual([
				'a', 'b', 'c', 'd', 'e', 'f', 'a2', 'b2', 'c2', 'd2', 'e2', 'f2'
			])

		it 'renders correct order when ordered by title', ->
			initCalendar
				resourceOrder: 'title'
			expect(getOrderedResourceIds()).toEqual([
				'a', 'a2', 'b', 'b2', 'c', 'c2', 'd', 'd2', 'e', 'e2', 'f', 'f2'
			])

		getOrderedResourceIds = ->
			$('.fc-resource-area tr[data-resource-id]').map (i, node) ->
					$(node).data('resource-id')
				.get()
