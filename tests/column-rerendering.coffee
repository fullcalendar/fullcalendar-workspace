
describe 'column-based view rerendering', ->

	describe 'when using rerenderEvents', ->

		it 'maintains scroll', (done) ->
			testScroll ->
					currentCalendar.rerenderEvents()
				, done

	describe 'when using refetchEvents', ->

		it 'maintains scroll', (done) ->
			testScroll ->
					currentCalendar.refetchEvents()
				, done

	describe 'when using rerenderResources', ->

		it 'rerenders the DOM', (done) ->
			testRerender ->
					currentCalendar.rerenderResources()
				, done

		it 'maintains scroll', (done) ->
			testScroll ->
					currentCalendar.rerenderResources()
				, done

	describe 'when using refetchResources', ->

		it 'rerenders the DOM', (done) ->
			testRefetch ->
					currentCalendar.refetchResources()
				, done

		it 'maintains scroll', (done) ->
			testScroll ->
					currentCalendar.refetchResources()
				, done

	describeOptions 'defaultView', {
		'when agenda': 'agendaDay'
		'when basic': 'basicDay'
	}, ->
		pushOptions
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


	testRerender = (actionFunc, doneFunc) ->
		renderCalls = 0
		initCalendar
			now: '2015-08-07'
			scrollTime: '00:00'
			defaultView: 'agendaDay'
			resources: (callback) ->
				setTimeout ->
						callback [
							{ id: 'a', title: 'Auditorium A' }
							{ id: 'b', title: 'Auditorium B' }
							{ id: 'c', title: 'Auditorium C' }
						]
					, 100
			events: (start, end, timezone, callback) ->
				setTimeout ->
						callback [
							{ id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' }
							{ id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' }
							{ id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' }
						]
					, 100
			resourceRender: (resource, headTd) ->
				headTd.text(resource.title + renderCalls)
			eventAfterAllRender: ->
				cellText = $.trim($('th[data-resource-id="a"]').text())
				renderCalls++
				if renderCalls == 1
					expect(cellText).toBe('Auditorium A0')
					actionFunc()
				else if renderCalls == 2
					expect(cellText).toBe('Auditorium A1')
					doneFunc()

	testRefetch = (actionFunc, doneFunc) ->
		renderCalls = 0
		initCalendar
			now: '2015-08-07'
			scrollTime: '00:00'
			defaultView: 'agendaDay'
			resources: (callback) ->
				setTimeout ->
						callback [
							{ id: 'a', title: 'Auditorium A' + renderCalls }
							{ id: 'b', title: 'Auditorium B' }
							{ id: 'c', title: 'Auditorium C' }
						]
					, 100
			events: (start, end, timezone, callback) ->
				setTimeout ->
						callback [
							{ id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' }
							{ id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' }
							{ id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' }
						]
					, 100
			eventAfterAllRender: ->
				cellText = $.trim($('th[data-resource-id="a"]').text())
				renderCalls++
				if renderCalls == 1
					expect(cellText).toBe('Auditorium A0')
					actionFunc()
				else if renderCalls == 2
					expect(cellText).toBe('Auditorium A1')
					doneFunc()

	testScroll = (actionFunc, doneFunc) ->
		renderCalls = 0
		initCalendar
			now: '2015-08-07'
			scrollTime: '00:00'
			defaultView: 'agendaDay'
			resources: (callback) ->
				setTimeout ->
						callback [
							{ id: 'a', title: 'Auditorium A' }
							{ id: 'b', title: 'Auditorium B' }
							{ id: 'c', title: 'Auditorium C' }
						]
					, 100
			events: (start, end, timezone, callback) ->
				setTimeout ->
						callback [
							{ id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' }
							{ id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' }
							{ id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' }
						]
					, 100
			eventAfterAllRender: ->
				scrollEl = $('.fc-time-grid-container.fc-scroller')
				renderCalls++
				if renderCalls == 1
					setTimeout ->
							scrollEl.scrollTop(100)
							setTimeout(actionFunc, 100)
						, 100
				else if renderCalls == 2
					expect(scrollEl.scrollTop()).toBe(100)
					doneFunc()

	# TODO: consolidate. also in resourceOrder
	getOrderedResourceIds = ->
		$('th.fc-resource-cell').map (i, node) ->
				$(node).data('resource-id')
			.get()
