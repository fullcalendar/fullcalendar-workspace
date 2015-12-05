
describe 'vresource businessHours', ->
	pushOptions
		now: '2015-11-18'
		businessHours: true
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]

	describeOptions 'isRTL', {
		'when LTR': false
		'when RTL': true
	}, (isRTL) ->

		describe 'for basicWeek', ->
			pushOptions
				defaultView: 'basicWeek'

			describe 'when resources above dates', ->
				pushOptions
					groupByResource: true

				it 'greys out sat and sun', (done) ->
					initCalendar
						viewRender: ->
							aHeadRect = getBoundingRect(getHeadResourceEls('a'))
							bHeadRect = getBoundingRect(getHeadResourceEls('b'))
							aSunRect = getLeadingBoundingRect(getHeadDowEls('sun'), isRTL)
							aSatRect = getLeadingBoundingRect(getHeadDowEls('sat'), isRTL)
							bSunRect = getTrailingBoundingRect(getHeadDowEls('sun'), isRTL)
							bSatRect = getTrailingBoundingRect(getHeadDowEls('sat'), isRTL)
							bizRects = sortBoundingRects(getDayGridNonBizHourEls(), isRTL)
							expect(bizRects.length).toBe(4)
							expect(aSunRect).toBeMostlyHorizontallyWithin(aHeadRect)
							expect(aSatRect).toBeMostlyHorizontallyWithin(aHeadRect)
							expect(bSunRect).toBeMostlyHorizontallyWithin(bHeadRect)
							expect(bSatRect).toBeMostlyHorizontallyWithin(bHeadRect)
							expect(bizRects[0]).toBeMostlyHorizontallyWithin(aSunRect)
							expect(bizRects[1]).toBeMostlyHorizontallyWithin(aSatRect)
							expect(bizRects[2]).toBeMostlyHorizontallyWithin(bSunRect)
							expect(bizRects[3]).toBeMostlyHorizontallyWithin(bSatRect)
							done()

			describe 'when dates above resources', ->
				pushOptions
					groupByDateAndResource: true

				it 'greys out sat and sunday', (done) ->
					initCalendar
						viewRender: ->
							sunHeadRect = getBoundingRect(getHeadDowEls('sun'))
							satHeadRect = getBoundingRect(getHeadDowEls('sat'))
							bizRects = sortBoundingRects(getDayGridNonBizHourEls(), isRTL)
							expect(bizRects.length).toBe(4)
							expect(bizRects[0]).toBeMostlyHorizontallyWithin(sunHeadRect)
							expect(bizRects[1]).toBeMostlyHorizontallyWithin(sunHeadRect)
							expect(bizRects[2]).toBeMostlyHorizontallyWithin(satHeadRect)
							expect(bizRects[3]).toBeMostlyHorizontallyWithin(satHeadRect)
							done()

		describe 'for agendaWeek', ->
			pushOptions
				defaultView: 'agendaWeek'

			describe 'when resources above dates', ->
				pushOptions
					groupByResource: true

				it 'greys out sat and sun', (done) ->
					initCalendar
						viewRender: ->
							aRect = getBoundingRect(getHeadResourceEls('a'))
							bRect = getBoundingRect(getHeadResourceEls('b'))
							bizRects = sortBoundingRects(getTimeGridNonBizHourEls(), isRTL)
							expect(bizRects.length).toBe(24)
							for bizRect, i in bizRects
								if i < 12
									expect(bizRect).toBeMostlyHorizontallyWithin(aRect)
								else
									expect(bizRect).toBeMostlyHorizontallyWithin(bRect)
							done()

			describe 'when dates above resources', ->
				pushOptions
					groupByDateAndResource: true

				it 'greys out sat and sun', (done) ->
					initCalendar
						viewRender: ->
							bizRects = sortBoundingRects(getTimeGridNonBizHourEls(), isRTL)
							sunRect = getBoundingRect(getHeadDowEls('sun'))
							monRect = getBoundingRect(getHeadDowEls('mon'))
							tueRect = getBoundingRect(getHeadDowEls('tue'))
							wedRect = getBoundingRect(getHeadDowEls('wed'))
							thuRect = getBoundingRect(getHeadDowEls('thu'))
							friRect = getBoundingRect(getHeadDowEls('fri'))
							satRect = getBoundingRect(getHeadDowEls('sat'))
							expect(bizRects[0]).toBeMostlyHorizontallyWithin(sunRect)
							expect(bizRects[1]).toBeMostlyHorizontallyWithin(sunRect)
							expect(bizRects[2]).toBeMostlyHorizontallyWithin(monRect)
							expect(bizRects[3]).toBeMostlyHorizontallyWithin(monRect)
							expect(bizRects[4]).toBeMostlyHorizontallyWithin(monRect)
							expect(bizRects[5]).toBeMostlyHorizontallyWithin(monRect)
							expect(bizRects[6]).toBeMostlyHorizontallyWithin(tueRect)
							expect(bizRects[7]).toBeMostlyHorizontallyWithin(tueRect)
							expect(bizRects[8]).toBeMostlyHorizontallyWithin(tueRect)
							expect(bizRects[9]).toBeMostlyHorizontallyWithin(tueRect)
							expect(bizRects[10]).toBeMostlyHorizontallyWithin(wedRect)
							expect(bizRects[11]).toBeMostlyHorizontallyWithin(wedRect)
							expect(bizRects[12]).toBeMostlyHorizontallyWithin(wedRect)
							expect(bizRects[13]).toBeMostlyHorizontallyWithin(wedRect)
							expect(bizRects[14]).toBeMostlyHorizontallyWithin(thuRect)
							expect(bizRects[15]).toBeMostlyHorizontallyWithin(thuRect)
							expect(bizRects[16]).toBeMostlyHorizontallyWithin(thuRect)
							expect(bizRects[17]).toBeMostlyHorizontallyWithin(thuRect)
							expect(bizRects[18]).toBeMostlyHorizontallyWithin(friRect)
							expect(bizRects[19]).toBeMostlyHorizontallyWithin(friRect)
							expect(bizRects[20]).toBeMostlyHorizontallyWithin(friRect)
							expect(bizRects[21]).toBeMostlyHorizontallyWithin(friRect)
							expect(bizRects[22]).toBeMostlyHorizontallyWithin(satRect)
							expect(bizRects[23]).toBeMostlyHorizontallyWithin(satRect)
							done()

	getDayGridNonBizHourEls = ->
		$('.fc-day-grid .fc-nonbusiness')

	getTimeGridNonBizHourEls = ->
		$('.fc-time-grid .fc-nonbusiness')
