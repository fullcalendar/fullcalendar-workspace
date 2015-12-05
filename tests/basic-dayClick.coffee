
describe 'basic-view dayClick', ->
	pushOptions
		now: '2015-11-28'
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		views:
			basicThreeDay:
				type: 'basic'
				duration: { days: 3 }

	describe 'when there are no resource columns', ->
		pushOptions
			defaultView: 'basicWeek'
			groupByResource: false

		it 'allows non-resource clicks', (done) ->
			dayClickCalled = false
			initCalendar
				eventAfterAllRender: ->
					monEls = getDayGridDowEls('mon')
					expect(monEls.length).toBe(1)
					monEls.eq(0)
						.simulate 'drag',
							callback: ->
								expect(dayClickCalled).toBe(true)
								done()
				dayClick: (date, jsEvent, view, resource) ->
					dayClickCalled = true
					expect(date).toEqualMoment('2015-11-23')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource).toBeFalsy()

	describe 'with resource columns above date columns', ->
		pushOptions
			defaultView: 'basicThreeDay'
			groupByResource: true

		it 'allows a resource click', (done) ->
			dayClickCalled = false
			initCalendar
				eventAfterAllRender: ->
					sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
					sunAEl.simulate 'drag',
						callback: ->
							expect(dayClickCalled).toBe(true)
							done()
				dayClick: (date, jsEvent, view, resource) ->
					dayClickCalled = true
					expect(date).toEqualMoment('2015-11-29')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource.id).toBe('a')

	describe 'with date columns above resource columns', ->
		pushOptions
			defaultView: 'basicThreeDay'
			groupByDateAndResource: true

		it 'allows a resource click', (done) ->
			dayClickCalled = false
			initCalendar
				eventAfterAllRender: ->
					rects = sortBoundingRects(getDayGridDowEls('mon'))
					monBEl = $(rects[1].node)
					monBEl.simulate 'drag',
						callback: ->
							expect(dayClickCalled).toBe(true)
							done()
				dayClick: (date, jsEvent, view, resource) ->
					dayClickCalled = true
					expect(date).toEqualMoment('2015-11-30')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource.id).toBe('b')
