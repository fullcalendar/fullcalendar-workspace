
describe 'vresource structure', ->
	pushOptions
		now: '2015-11-16'

	describeValues {
		'with agenda views': 'agenda'
		'with basic views': 'basic'
	}, (viewType) ->

		pushOptions
			scrollTime: '00:00'
			resources: [
				{ id: 'a', title: 'Resource A' }
				{ id: 'b', title: 'Resource B' }
				{ id: 'c', title: 'Resource C' }
				{ id: 'd', title: 'Resource D' }
			]

		describe 'when one-day', ->
			pushOptions
				defaultView: viewType + 'Day'

			describe 'when LTR', ->
				pushOptions
					isRTL: false

				it 'renders cells right-to-left', (callback) ->
					initCalendar
						viewRender: ->
							aRect = getBoundingRect(checkResourceHeadEl('Resource A'))
							bRect = getBoundingRect(checkResourceHeadEl('Resource B'))
							cRect = getBoundingRect(checkResourceHeadEl('Resource C'))
							dRect = getBoundingRect(checkResourceHeadEl('Resource D'))
							expect(aRect).toBeMostlyLeftOf(bRect)
							expect(bRect).toBeMostlyLeftOf(cRect)
							expect(cRect).toBeMostlyLeftOf(dRect)
							expect(getDowBodyEls('mon', viewType).length).toBe(4)
							callback()

			describe 'when RTL', ->
				pushOptions
					isRTL: true

				it 'renders cells left-to-right', (callback) ->
					initCalendar
						viewRender: ->
							aRect = getBoundingRect(checkResourceHeadEl('Resource A'))
							bRect = getBoundingRect(checkResourceHeadEl('Resource B'))
							cRect = getBoundingRect(checkResourceHeadEl('Resource C'))
							dRect = getBoundingRect(checkResourceHeadEl('Resource D'))
							expect(aRect).toBeMostlyRightOf(bRect)
							expect(bRect).toBeMostlyRightOf(cRect)
							expect(cRect).toBeMostlyRightOf(dRect)
							expect(getDowBodyEls('mon', viewType).length).toBe(4)
							callback()

		describe 'with two-day', ->
			pushOptions
				views:
					twoDay:
						type: viewType
						duration: { days: 2 }
				defaultView: 'twoDay'

			describe 'when resources are above dates', ->
				pushOptions
					groupByResource: true
					groupByDateAndResource: false # should be default

				it 'renders cells correctly', (callback) ->
					initCalendar
						viewRender: ->
							aEl = checkResourceHeadEl('Resource A')
							aRect = getBoundingRect(aEl)
							monEls = getDowHeadEls('mon')
							tuesEls = getDowHeadEls('tue')
							expect(monEls.length).toBe(4)
							expect(tuesEls.length).toBe(4)
							monRect = getBoundingRect(monEls.eq(0))
							expect(aRect).toBeMostlyAbove(monRect)
							expect(getDowBodyEls('mon', viewType).length).toBe(4)
							expect(getDowBodyEls('tue', viewType).length).toBe(4)
							callback()

			describe 'when dates are above resources', ->
				pushOptions
					groupByDateAndResource: true

				it 'renders cells correctly', (callback) ->
					initCalendar
						viewRender: ->
							monEl = checkDowHeadEl('mon')
							monRect = getBoundingRect(monEl)
							expect(monEl.length).toBe(1)
							aEls = getResourceHeadEls('Resource A')
							bEls = getResourceHeadEls('Resource B')
							expect(aEls.length).toBe(2)
							expect(bEls.length).toBe(2)
							aRect = getBoundingRect(aEls.eq(0))
							expect(monRect).toBeMostlyAbove(aRect)
							expect(getDowBodyEls('mon', viewType).length).toBe(4)
							expect(getDowBodyEls('tue', viewType).length).toBe(4)
							callback()

		describe 'when no groupBy settings specified', ->

			describe 'when one-day', ->
				pushOptions
					defaultView: viewType + 'Day'

				it 'renders resources columns', (callback) ->
					initCalendar
						viewRender: ->
							expect(getResourceHeadEls('Resource A').length).toBe(1)
							expect(getResourceHeadEls('Resource B').length).toBe(1)
							expect(getResourceHeadEls('Resource C').length).toBe(1)
							expect(getResourceHeadEls('Resource D').length).toBe(1)
							callback()

			describe 'when one-week', ->
				pushOptions
					defaultView: viewType + 'Week'

				it 'renders resources columns', (callback) ->
					initCalendar
						viewRender: ->
							expect(getResourceHeadEls('Resource A').length).toBe(0)
							expect(getResourceHeadEls('Resource B').length).toBe(0)
							expect(getResourceHeadEls('Resource C').length).toBe(0)
							expect(getResourceHeadEls('Resource D').length).toBe(0)
							callback()

		describe 'when delay in resource fetching', ->
			pushOptions
				defaultView: viewType + 'Day'
				resources: (callback) ->
					setTimeout ->
							callback([
								{ id: 'a', title: 'Resource A' }
								{ id: 'b', title: 'Resource B' }
							])
						, 200

			it 'renders progressively', (callback) ->
				firstCallbackCalled = false
				firstCallback = ->
					expect(getResourceHeadEls('Resource A').length).toBe(0)
					expect(getResourceHeadEls('Resource B').length).toBe(0)
					checkDowHeadEl('mon')
					firstCallbackCalled = true
				initCalendar
					viewRender: ->
						expect(getResourceHeadEls('Resource A').length).toBe(1)
						expect(getResourceHeadEls('Resource B').length).toBe(1)
						expect(firstCallbackCalled).toBe(true)
						callback()
				setTimeout firstCallback, 100

	describe 'when month view', ->
		pushOptions
			defaultView: 'month'
			groupByResource: true
			resources: [
				{ id: 'a', title: 'Resource A' }
				{ id: 'b', title: 'Resource B' }
			]

		describeOptions 'isRTL', {
			'when LTR': false
			'when RTL': true
		}, (isRTL) ->

			it 'renders side-by-side months', (callback) ->
				initCalendar
					viewRender: ->
						checkResourceHeadEl('Resource A')
						checkResourceHeadEl('Resource B')
						expect(getDowHeadEls('sun').length).toBe(2)
						expect($('.fc-body .fc-row').length).toBe(6)
						firstADayRect = getLeadingBoundingRect('td[data-date="2015-11-01"]', isRTL)
						lastADayRect = getLeadingBoundingRect('td[data-date="2015-12-12"]', isRTL)
						firstBDayRect = getTrailingBoundingRect('td[data-date="2015-11-01"]', isRTL)
						lastBDayRect = getTrailingBoundingRect('td[data-date="2015-12-12"]', isRTL)
						aDayRect = joinRects(firstADayRect, lastADayRect)
						aDayRect.right -= 1 # might share a pixel
						aDayRect.left += 1 # ditto, but for rtl
						bDayRect = joinRects(firstBDayRect, lastBDayRect)
						if isRTL
							expect(aDayRect).toBeRightOf(bDayRect)
						else
							expect(aDayRect).toBeLeftOf(bDayRect)
						callback()
