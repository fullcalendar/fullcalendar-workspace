describe 'eventConstraint', ->
	pushOptions
		now: '2016-09-04'
		defaultView: 'timelineWeek'
		scrollTime: '00:00'
		editable: true
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
			{ id: 'c', title: 'Resource C' }
		]
		events: [
			{
				title: 'event 1'
				start: '2016-09-04T01:00'
				resourceId: 'b'
			}
		]

	# FYI: the fact that eventContraint may be specified in Event Source and Event Objects
	# is covered by the core tests.

	describe 'with one resourceId', ->
		pushOptions
			eventConstraint:
				resourceId: 'b'

		it 'allows dragging to the resource', (done) ->
			initCalendar()
			dragResourceTimelineEvent(
				$('.fc-event'),
				{ date: '2016-09-04T03:00:00', resourceId: 'b' }
			).then (modifiedEvent) ->
				expect(modifiedEvent.start.format()).toBe('2016-09-04T03:00:00')
				done()

		it 'disallows dragging to other resources', (done) ->
			initCalendar()
			dragResourceTimelineEvent(
				$('.fc-event'),
				{ date: '2016-09-04T03:00:00', resourceId: 'c' }
			).then (modifiedEvent) ->
				expect(modifiedEvent).toBeFalsy() # failure
				done()

	describe 'with multiple resourceIds', ->
		pushOptions
			eventConstraint:
				resourceIds: [ 'b', 'c' ]

		it 'allows dragging to whitelisted resource', (done) ->
			initCalendar()
			dragResourceTimelineEvent(
				$('.fc-event'),
				{ date: '2016-09-04T03:00:00', resourceId: 'c' }
			).then (modifiedEvent) ->
				expect(modifiedEvent.start.format()).toBe('2016-09-04T03:00:00')
				done()

		it 'disallows dragging to non-whitelisted resources', (done) ->
			initCalendar()
			dragResourceTimelineEvent(
				$('.fc-event'),
				{ date: '2016-09-04T03:00:00', resourceId: 'a' }
			).then (modifiedEvent) ->
				expect(modifiedEvent).toBeFalsy() # failure
				done()
