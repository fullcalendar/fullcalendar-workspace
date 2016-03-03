
describe 'timeline view rerendering', ->

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
			testRefetch ->
					currentCalendar.refetchResources()
				, done

	describe 'when only a few resources', ->
		pushOptions
			defaultView: 'timelineDay'
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


	testScroll = (actionFunc, doneFunc) ->
		renderCalls = 0
		initCalendar
			now: '2015-08-07'
			scrollTime: '00:00'
			defaultView: 'timelineDay'
			events: (start, end, timezone, callback) ->
				setTimeout ->
						callback(getEvents())
					, 100
			resources: (callback) ->
				setTimeout ->
						callback(getResources())
					, 100
			eventAfterAllRender: ->
				scrollEl = $('.fc-body .fc-time-area .fc-scroller')
				renderCalls++
				if renderCalls == 1
					setTimeout ->
							scrollEl.scrollTop(100)
							scrollEl.scrollLeft(50)
							setTimeout(actionFunc, 100)
						, 100
				else if renderCalls == 2
					expect(scrollEl.scrollTop()).toBe(100)
					expect(scrollEl.scrollLeft()).toBe(50)
					doneFunc()

	testRerender = (actionFunc, doneFunc) ->
		renderCalls = 0
		initCalendar
			now: '2015-08-07'
			scrollTime: '00:00'
			defaultView: 'timelineDay'
			events: (start, end, timezone, callback) ->
				setTimeout ->
						callback(getEvents())
					, 100
			resources: (callback) ->
				setTimeout ->
						callback(getResources())
					, 100
			resourceRender: (resource, headTd) ->
				if resource.id == 'e'
					headTd.find('.fc-cell-text').text(resource.title + renderCalls)
			eventAfterAllRender: ->
				cellText = $.trim($('tr[data-resource-id="e"] .fc-cell-text').text())
				renderCalls++
				if renderCalls == 1
					expect(cellText).toBe('Auditorium E0')
					actionFunc()
				else if renderCalls == 2
					expect(cellText).toBe('Auditorium E1')
					doneFunc()

	testRefetch = (actionFunc, doneFunc) ->
		renderCalls = 0
		initCalendar
			now: '2015-08-07'
			scrollTime: '00:00'
			defaultView: 'timelineDay'
			events: (start, end, timezone, callback) ->
				setTimeout ->
						callback(getEvents())
					, 100
			resources: (callback) ->
				setTimeout ->
						callback(getResources(renderCalls)) # renderCalls affects data!
					, 100
			eventAfterAllRender: ->
				cellText = $.trim($('tr[data-resource-id="e"] .fc-cell-text').text())
				renderCalls++
				if renderCalls == 1
					expect(cellText).toBe('Auditorium E0')
					actionFunc()
				else if renderCalls == 2
					expect(cellText).toBe('Auditorium E1')
					doneFunc()

	getResources = (cnt='') ->
		[
			{ id: 'a', title: 'Auditorium A' }
			{ id: 'b', title: 'Auditorium B' }
			{ id: 'c', title: 'Auditorium C' }
			{ id: 'd', title: 'Auditorium D' }
			{ id: 'e', title: 'Auditorium E' + cnt }
			{ id: 'f', title: 'Auditorium F' }
			{ id: 'g', title: 'Auditorium G' }
			{ id: 'h', title: 'Auditorium H' }
			{ id: 'i', title: 'Auditorium I' }
			{ id: 'j', title: 'Auditorium J' }
			{ id: 'k', title: 'Auditorium K' }
			{ id: 'l', title: 'Auditorium L' }
			{ id: 'm', title: 'Auditorium M' }
			{ id: 'n', title: 'Auditorium N' }
			{ id: 'o', title: 'Auditorium O' }
			{ id: 'p', title: 'Auditorium P' }
			{ id: 'q', title: 'Auditorium Q' }
			{ id: 'r', title: 'Auditorium R' }
			{ id: 's', title: 'Auditorium S' }
			{ id: 't', title: 'Auditorium T' }
			{ id: 'u', title: 'Auditorium U' }
			{ id: 'v', title: 'Auditorium V' }
			{ id: 'w', title: 'Auditorium W' }
			{ id: 'x', title: 'Auditorium X' }
			{ id: 'y', title: 'Auditorium Y' }
			{ id: 'z', title: 'Auditorium Z' }
		]

	getEvents = ->
		[
			{ id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' }
			{ id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' }
			{ id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' }
			{ id: '4', resourceId: 'e', start: '2015-08-07T03:00:00', end: '2015-08-07T08:00:00', title: 'event 4' }
			{ id: '5', resourceId: 'f', start: '2015-08-07T00:30:00', end: '2015-08-07T02:30:00', title: 'event 5' }
		]

	# TODO: consolidate. also in resourceOrder
	getOrderedResourceIds = ->
		$('.fc-resource-area tr[data-resource-id]').map (i, node) ->
				$(node).data('resource-id')
			.get()
