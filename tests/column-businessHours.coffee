
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
							expect(aSunRect).toBeMostlyHBoundedBy(aHeadRect)
							expect(aSatRect).toBeMostlyHBoundedBy(aHeadRect)
							expect(bSunRect).toBeMostlyHBoundedBy(bHeadRect)
							expect(bSatRect).toBeMostlyHBoundedBy(bHeadRect)
							expect(bizRects[0]).toBeMostlyHBoundedBy(aSunRect)
							expect(bizRects[1]).toBeMostlyHBoundedBy(aSatRect)
							expect(bizRects[2]).toBeMostlyHBoundedBy(bSunRect)
							expect(bizRects[3]).toBeMostlyHBoundedBy(bSatRect)
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
							expect(bizRects[0]).toBeMostlyHBoundedBy(sunHeadRect)
							expect(bizRects[1]).toBeMostlyHBoundedBy(sunHeadRect)
							expect(bizRects[2]).toBeMostlyHBoundedBy(satHeadRect)
							expect(bizRects[3]).toBeMostlyHBoundedBy(satHeadRect)
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
									expect(bizRect).toBeMostlyHBoundedBy(aRect)
								else
									expect(bizRect).toBeMostlyHBoundedBy(bRect)
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
							expect(bizRects[0]).toBeMostlyHBoundedBy(sunRect)
							expect(bizRects[1]).toBeMostlyHBoundedBy(sunRect)
							expect(bizRects[2]).toBeMostlyHBoundedBy(monRect)
							expect(bizRects[3]).toBeMostlyHBoundedBy(monRect)
							expect(bizRects[4]).toBeMostlyHBoundedBy(monRect)
							expect(bizRects[5]).toBeMostlyHBoundedBy(monRect)
							expect(bizRects[6]).toBeMostlyHBoundedBy(tueRect)
							expect(bizRects[7]).toBeMostlyHBoundedBy(tueRect)
							expect(bizRects[8]).toBeMostlyHBoundedBy(tueRect)
							expect(bizRects[9]).toBeMostlyHBoundedBy(tueRect)
							expect(bizRects[10]).toBeMostlyHBoundedBy(wedRect)
							expect(bizRects[11]).toBeMostlyHBoundedBy(wedRect)
							expect(bizRects[12]).toBeMostlyHBoundedBy(wedRect)
							expect(bizRects[13]).toBeMostlyHBoundedBy(wedRect)
							expect(bizRects[14]).toBeMostlyHBoundedBy(thuRect)
							expect(bizRects[15]).toBeMostlyHBoundedBy(thuRect)
							expect(bizRects[16]).toBeMostlyHBoundedBy(thuRect)
							expect(bizRects[17]).toBeMostlyHBoundedBy(thuRect)
							expect(bizRects[18]).toBeMostlyHBoundedBy(friRect)
							expect(bizRects[19]).toBeMostlyHBoundedBy(friRect)
							expect(bizRects[20]).toBeMostlyHBoundedBy(friRect)
							expect(bizRects[21]).toBeMostlyHBoundedBy(friRect)
							expect(bizRects[22]).toBeMostlyHBoundedBy(satRect)
							expect(bizRects[23]).toBeMostlyHBoundedBy(satRect)
							done()

	getDayGridNonBizHourEls = ->
		$('.fc-day-grid .fc-nonbusiness')

	getTimeGridNonBizHourEls = ->
		$('.fc-time-grid .fc-nonbusiness')
