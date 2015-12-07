
# TODO: test isRTL?

describe 'timeline-view event drag-n-drop', ->
	pushOptions
		editable: true
		now: '2015-11-29'
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		defaultView: 'timelineDay'
		scrollTime: '00:00'

	describeValues { # TODO: abstract this. on other views too
		'no timezone': 
			value: null
			moment: (str) ->
				$.fullCalendar.moment.parseZone(str)
		'local timezone':
			value: 'local'
			moment: (str) ->
				moment(str)
		'UTC timezone':
			value: 'UTC'
			moment: (str) ->
				moment.utc(str)
	}, (tz) ->
		pushOptions
			timezone: tz.value

		it 'allows switching date and resource', (done) ->
			initCalendar
				events: [
					{ title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
				]
				eventAfterAllRender: oneCall ->
					$('.event0').simulate 'drag',
						localPoint: { left: 0, top: '50%' }
						end: getResourceTimelinePoint('a', '2015-11-29T05:00:00')
						callback: ->
							expect(dropSpy).toHaveBeenCalled()
							done()
				eventDrop:
					dropSpy = spyCall (event) ->
						expect(event.start).toEqualMoment(tz.moment('2015-11-29T05:00:00'))
						expect(event.end).toEqualMoment(tz.moment('2015-11-29T06:00:00'))
						resource = currentCalendar.getEventResource(event)
						expect(resource.id).toBe('a')
