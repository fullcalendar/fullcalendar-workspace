
describe 'timeline now-indicator', ->
	pushOptions
		defaultView: 'timelineDay'
		now: '2015-12-26T02:30:00'
		nowIndicator: true
		scrollTime: '00:00'

	describeOptions 'isRTL', {
		'when LTR': false
		'when RTL': true
	}, ->

		describeOptions 'resources', {
			'when no resources': null
			'when resources': [
				{ id: 'a', title: 'Resource A' }
				{ id: 'b', title: 'Resource B' }
			]
		}, ->

			it 'doesn\'t render when out of view', (done) ->
				initCalendar
					defaultDate: '2015-12-27T02:30:00' # next day
				setTimeout -> # wait for scroll
					expect(getNowIndicatorRenders()).toBe(false)
					done()

			it 'renders when in view', (done) ->
				initCalendar()
				setTimeout -> # wait for scroll
					nowIndicatorRendersAt('2015-12-26T02:30:00')
					done()

	it 'refreshes at intervals', (done) ->
		initCalendar
			now: '2015-12-26T00:00:00'
			defaultView: 'timelineOneMinute'
			views:
				timelineOneMinute:
					type: 'timeline'
					duration: { minutes: 1 }
					slotDuration: { seconds: 1 }
		setTimeout ->
				nowIndicatorRendersAt('2015-12-26T00:00:01')
				setTimeout ->
						nowIndicatorRendersAt('2015-12-26T00:00:02')
						done()
					, 1000
			, 1000


	getNowIndicatorRenders = ->
		$('.fc-timeline .fc-now-indicator').length > 0

	nowIndicatorRendersAt = (date, slatOffset, thresh=3) ->
		# wish threshold could do a smaller default threshold, but RTL messing up
		line = getTimelineLine(date, slatOffset)
		arrowRect = getBoundingRect('.fc-timeline .fc-now-indicator-arrow')
		lineRect = getBoundingRect('.fc-timeline .fc-now-indicator-line')
		expect(Math.abs(
			(arrowRect.left + arrowRect.right) / 2 -
			line.left
		)).toBeLessThan(thresh)
		expect(Math.abs(
			(lineRect.left + lineRect.right) / 2 -
			line.left
		)).toBeLessThan(thresh)
