
describe 'basic-view selection', ->
	pushOptions
		now: '2015-11-28'
		selectable: true
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

		it 'allows non-resource selects', (done) ->
			selectCalled = false
			initCalendar
				eventAfterAllRender: ->
					monEls = getDayGridDowEls('mon')
					tueEls = getDayGridDowEls('tue')
					expect(monEls.length).toBe(1)
					expect(tueEls.length).toBe(1)
					monEls.eq(0)
						.simulate 'drag',
							end: tueEls.eq(0)
							callback: ->
								expect(selectCalled).toBe(true)
								done()
				select: (start, end, jsEvent, view, resource) ->
					selectCalled = true
					expect(start).toEqualMoment('2015-11-23')
					expect(end).toEqualMoment('2015-11-25')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource).toBeFalsy()

	describe 'with resource columns above date columns', ->
		pushOptions
			defaultView: 'basicThreeDay'
			groupByResource: true

		it 'allows a resource selects', (done) ->
			selectCalled = false
			initCalendar
				eventAfterAllRender: ->
					sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
					monAEl = $(getLeadingBoundingRect(getDayGridDowEls('mon')).node)
					sunAEl.simulate 'drag',
						end: monAEl
						callback: ->
							expect(selectCalled).toBe(true)
							done()
				select: (start, end, jsEvent, view, resource) ->
					selectCalled = true
					expect(start).toEqualMoment('2015-11-29')
					expect(end).toEqualMoment('2015-12-01')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource.id).toBe('a')

		it 'disallows a selection across resources', (done) ->
			selectCalled = false
			initCalendar
				eventAfterAllRender: ->
					sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
					monBEl = $(getTrailingBoundingRect(getDayGridDowEls('mon')).node)
					sunAEl.simulate 'drag',
						end: monBEl
						callback: ->
							expect(selectCalled).toBe(false)
							done()
				select: (start, end, jsEvent, view, resource) ->
					selectCalled = true

	describe 'with date columns above resource columns', ->
		pushOptions
			defaultView: 'basicThreeDay'
			groupByDateAndResource: true

		it 'allows a resource selection', (done) ->
			selectCalled = false
			initCalendar
				eventAfterAllRender: ->
					monRects = sortBoundingRects(getDayGridDowEls('mon'))
					monBEl = $(monRects[1].node)
					satRects = sortBoundingRects(getDayGridDowEls('sat'))
					satBEl = $(satRects[1].node)
					monBEl.simulate 'drag',
						end: satBEl
						callback: ->
							expect(selectCalled).toBe(true)
							done()
				select: (start, end, jsEvent, view, resource) ->
					selectCalled = true
					expect(start).toEqualMoment('2015-11-28')
					expect(end).toEqualMoment('2015-12-01')
					expect(typeof jsEvent).toBe('object')
					expect(typeof view).toBe('object')
					expect(resource.id).toBe('b')

		it 'disallows a selection across resources', (done) ->
			selectCalled = false
			initCalendar
				eventAfterAllRender: ->
					monRects = sortBoundingRects(getDayGridDowEls('mon'))
					monBEl = $(monRects[1].node)
					satRects = sortBoundingRects(getDayGridDowEls('sat'))
					satAEl = $(satRects[0].node)
					monBEl.simulate 'drag',
						end: satAEl
						callback: ->
							expect(selectCalled).toBe(false)
							done()
				select: (start, end, jsEvent, view, resource) ->
					selectCalled = true
