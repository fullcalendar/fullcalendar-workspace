
describe 'timeline businessHours', ->
	pushOptions
		defaultView: 'timelineDay'

	describeOptions 'isRTL', {
		'when LTR': false
		'when RTL': true
	}, ->

		it 'renders when on a day with business hours', (done) ->
			initCalendar
				now: '2016-02-15'
				businessHours: {
					start: '10:00'
					end: '16:00'
				}
				slotDuration: { hours: 1 }
				viewRender: ->
					greyAreas = $('.fc-nonbusiness')
					expect(greyAreas.length).toBe(2)
					expectTimelineSpan(greyAreas.eq(0), '2016-02-15T00:00', '2016-02-15T10:00')
					expectTimelineSpan(greyAreas.eq(1), '2016-02-15T16:00', '2016-02-15T23:00', 1) # 24:00
					done()

		# FAILS
		xit 'renders all-day on a day completely outside of business hours', (done) ->
			initCalendar
				now: '2016-02-14' # weekend
				businessHours: {
					start: '10:00'
					end: '16:00'
				}
				slotDuration: { hours: 1 }
				viewRender: ->
					greyAreas = $('.fc-nonbusiness')
					expect(greyAreas.length).toBe(1)
					expectTimelineSpan(greyAreas.eq(0), '2016-02-15T00:00', '2016-02-15T23:00', 1) # 24:00
					done()

	expectTimelineSpan = (el, startTime, endTime, slatOffset) ->
		isRTL = isElWithinRtl(el)
		elRect = getBoundingRect(el)
		expect(Math.abs(
			getTimelineLeft(startTime) -
			if isRTL then elRect.right else elRect.left
		)).toBeLessThan(3)
		expect(Math.abs(
			getTimelineLeft(endTime, slatOffset) -
			if isRTL then elRect.left else elRect.right
		)).toBeLessThan(3)
