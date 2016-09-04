describe 'selectAllow', ->
	pushOptions
		now: '2016-09-04'
		defaultView: 'timelineWeek'
		scrollTime: '00:00'
		selectable: true
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]

	it 'disallows selecting when returning false', (done) -> # and given correct params
		isCalled = false

		initCalendar
			selectAllow: (selectInfo) ->
				expect(selectInfo.resourceId).toBe('b')
				isCalled = true
				false

		selectResourceTimeline(
			{ resourceId: 'b', date: '2016-09-04T03:00:00' }
			{ resourceId: 'b', date: '2016-09-04T06:00:00' }
		).then (selectInfo) ->
			expect(selectInfo).toBeFalsy() # drop failure?
			expect(isCalled).toBe(true)
			done()

	it 'allows selecting when returning false', (done) ->
		isCalled = false

		initCalendar
			selectAllow: (selectInfo) ->
				isCalled = true
				true

		selectResourceTimeline(
			{ resourceId: 'b', date: '2016-09-04T03:00:00' }
			{ resourceId: 'b', date: '2016-09-04T06:00:00' }
		).then (selectInfo) ->
			expect(typeof selectInfo).toBe('object')
			expect(selectInfo.start.format()).toBe('2016-09-04T03:00:00')
			expect(selectInfo.end.format()).toBe('2016-09-04T07:00:00') # because hour slots
			expect(isCalled).toBe(true)
			done()
