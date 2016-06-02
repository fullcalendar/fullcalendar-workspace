
describe 'destroy', ->
	pushOptions
		defaultDate: '2016-06-01'
		droppable: true # high chance of attaching global handlers
		editable: true # same
		resources: [
			{ id: 'a', title: 'a' }
			{ id: 'b', title: 'b' }
		]
		events: [
			{ start: '2016-06-01T09:00:00', title: 'event1', resourceId: 'a' }
		]

	describeOptions 'defaultView', {
		'when timelineDay view': 'timelineDay'
		'when vertical resource view': 'agendaDay'
		'when basic vertical resource view': 'basicDay'
	}, ->
		it 'unbinds all handlers', (done) ->
			setTimeout -> # other tests might still be cleaning up after their callbacks
				documentCnt = countHandlers(document)
				windowCnt = countHandlers(window)
				initCalendar
					allDaySlot: false
					eventAfterAllRender: ->
						setTimeout -> # wait to render events
							currentCalendar.destroy()
							window.currentCalendar = null # for tests/util.coffee
							$el = $('#calendar')
							expect($el.length).toBe(1)
							expect(countHandlers($el)).toBe(0)
							expect(countHandlers(document)).toBe(documentCnt)
							expect(countHandlers(window)).toBe(windowCnt)
							expect($el.attr('class') || '').toBe('')
							done()
						, 0
			, 0