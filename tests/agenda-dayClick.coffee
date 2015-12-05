
describe 'agenda-view dayClick', ->
	pushOptions
		now: '2015-11-28'
		scrollTime: '00:00'
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		views:
			agendaThreeDay:
				type: 'agenda'
				duration: { days: 3 }

	describe 'when there are no resource columns', ->
		pushOptions
			defaultView: 'agendaWeek'
			groupByResource: false

		it 'allows non-resource clicks', (done) ->
			dayClickCalled = false
			initCalendar
				eventAfterAllRender: ->
					$.simulateByPoint 'drag',
						point: getTimeGridPoint('2015-11-23T09:00:00')
						callback: ->
							expect(dayClickCalled).toBe(true)
							done()
				dayClick: (date, jsEvent, view, resource) ->
					dayClickCalled = true
					expect(date).toEqualMoment('2015-11-23T09:00:00')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource).toBeFalsy()

	describe 'with resource columns above date columns', ->
		pushOptions
			defaultView: 'agendaThreeDay'
			groupByResource: true

		it 'allows a resource click', (done) ->
			dayClickCalled = false
			initCalendar
				eventAfterAllRender: ->
					$.simulateByPoint 'drag',
						point: getResourceTimeGridPoint('b', '2015-11-29T09:00:00')
						callback: ->
							expect(dayClickCalled).toBe(true)
							done()
				dayClick: (date, jsEvent, view, resource) ->
					dayClickCalled = true
					expect(date).toEqualMoment('2015-11-29T09:00:00')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource.id).toBe('b')

	describe 'with date columns above resource columns', ->
		pushOptions
			defaultView: 'agendaThreeDay'
			groupByDateAndResource: true

		it 'allows a resource click', (done) ->
			dayClickCalled = false
			initCalendar
				eventAfterAllRender: ->
					$.simulateByPoint 'drag',
						point: getResourceTimeGridPoint('b', '2015-11-30T09:30:00')
						callback: ->
							done()
				dayClick: (date, jsEvent, view, resource) ->
					dayClickCalled = true
					expect(date).toEqualMoment('2015-11-30T09:30:00')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource.id).toBe('b')
