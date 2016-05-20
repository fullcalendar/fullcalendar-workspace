
# TODO: do resizing from the start
# TODO: more tests when slotDuration=1week, no event end. resize behavior?

describe 'timeline event resizing', ->
	pushOptions
		now: '2015-11-28'
		scrollTime: '00:00'
		editable: true
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]

	describeOptions 'isRTL', {
		'LTR': false
		'RTL': true
	}, (isRTL) ->

		describeTimezones (tz) ->

			describe 'when time scale', ->
				pushOptions
					defaultView: 'timelineDay'

				describe 'when snap matches slots', ->

					describe 'when no resources', ->
						pushOptions
							resources: false

						it 'reports resize with no resource', (done) ->
							initCalendar
								events: [
									{ title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00' }
								]
								eventAfterAllRender: oneCall ->
									$('.event1').simulate('mouseover') # resizer only shows on hover
									$('.event1 .fc-end-resizer')
										.simulate 'drag',
											end: getTimelineSlatEl('2015-11-28T07:00:00')
											callback: ->
												expect(resizeSpy).toHaveBeenCalled()
												done()
								eventResize:
									resizeSpy = spyCall (event) ->
										expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
										expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
										resource = currentCalendar.getEventResource(event)
										expect(resource).toBeFalsy()

					describe 'when resources', ->

						it 'reports resize on a resource', (done) ->
							initCalendar
								events: [
									{ title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
								]
								eventAfterAllRender: oneCall ->
									$('.event1').simulate('mouseover') # resizer only shows on hover
									$('.event1 .fc-end-resizer')
										.simulate 'drag',
											end: getResourceTimelinePoint('b', '2015-11-28T07:00:00')
											callback: ->
												expect(resizeSpy).toHaveBeenCalled()
												done()
								eventResize:
									resizeSpy = spyCall (event) ->
										expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
										expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
										resource = currentCalendar.getEventResource(event)
										expect(resource.id).toBe('b')

						it 'reports resize across resources', (done) ->
							initCalendar
								events: [
									{ title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
								]
								eventAfterAllRender: oneCall ->
									$('.event1').simulate('mouseover') # resizer only shows on hover
									$('.event1 .fc-end-resizer')
										.simulate 'drag',
											end: getResourceTimelinePoint('a', '2015-11-28T07:00:00')
											callback: ->
												expect(resizeSpy).toHaveBeenCalled()
												done()
								eventResize:
									resizeSpy = spyCall (event) ->
										expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
										expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
										resource = currentCalendar.getEventResource(event)
										expect(resource.id).toBe('b')

				describe 'when snap smaller than slots', ->
					pushOptions
						slotDuration: '00:30'
						snapDuration: '00:15'

					it 'reports a smaller granularity', (done) ->
						initCalendar
							events: [
								{ title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
							]
							eventAfterAllRender: oneCall ->
								$('.event1').simulate('mouseover') # resizer only shows on hover
								$('.event1 .fc-end-resizer')
									.simulate 'drag',
										end: getResourceTimelinePoint('b', '2015-11-28T07:30:00')
										callback: ->
											expect(resizeSpy).toHaveBeenCalled()
											done()
							eventResize:
								resizeSpy = spyCall (event) ->
									expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
									expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:45:00'))
									resource = currentCalendar.getEventResource(event)
									expect(resource.id).toBe('b')

		it 'works with touch', (done) ->
			initCalendar
				isTouch: true
				longPressDelay: 100
				defaultView: 'timelineDay'
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
				]
				eventAfterAllRender: oneCall ->
					$('.event1').simulate 'drag',
						isTouch: true
						delay: 200
						callback: ->
							$('.event1').simulate('mouseover') # resizer only shows on hover
							$('.event1 .fc-end-resizer').simulate 'drag',
								# hack to make resize start within the bounds of the event
								localPoint: { top: '50%', left: (if isRTL then '100%' else '0%') }
								isTouch: true
								end: getResourceTimelinePoint('b', '2015-11-28T07:00:00')
								callback: ->
									expect(resizeSpy).toHaveBeenCalled()
									done()
				eventResize:
					resizeSpy = spyCall (event) ->
						expect(event.start).toEqualMoment('2015-11-28T04:00:00')
						expect(event.end).toEqualMoment('2015-11-28T07:30:00')
						resource = currentCalendar.getEventResource(event)
						expect(resource.id).toBe('b')

		describe 'when day scale', ->
			pushOptions
				defaultView: 'timelineMonth'
				slotDuration: { days: 1 }

			it 'reports untimed dates', (done) ->
				initCalendar
					events: [
						{ title: 'event1', className: 'event1', start: '2015-11-03', resourceId: 'a' }
					]
					eventAfterAllRender: oneCall ->
						$('.event1').simulate('mouseover') # resizer only shows on hover
						$('.event1 .fc-end-resizer')
							.simulate 'drag',
								end: getResourceTimelinePoint('a', '2015-11-05')
								callback: ->
									expect(resizeSpy).toHaveBeenCalled()
									done()
					eventResize:
						resizeSpy = spyCall (event) ->
							expect(event.start).toEqualMoment('2015-11-03')
							expect(event.end).toEqualMoment('2015-11-06')
							resource = currentCalendar.getEventResource(event)
							expect(resource.id).toBe('a')

		describe 'when week scale', ->
			pushOptions
				defaultView: 'timelineYear'
				slotDuration: { weeks: 1 }

			it 'reports untimed dates', (done) -> # TODO: this is desired behavior when no end???
				initCalendar
					events: [
						{ title: 'event1', className: 'event1', start: '2015-01-18', end: '2015-01-25', resourceId: 'a' }
					]
					eventAfterAllRender: oneCall ->
						$('.event1').simulate('mouseover') # resizer only shows on hover
						$('.event1 .fc-end-resizer')
							.simulate 'drag',
								end: getResourceTimelinePoint('a', '2015-02-08')
								callback: ->
									expect(resizeSpy).toHaveBeenCalled()
									done()
					eventResize:
						resizeSpy = spyCall (event) ->
							expect(event.start).toEqualMoment('2015-01-18')
							expect(event.end).toEqualMoment('2015-02-15')
							resource = currentCalendar.getEventResource(event)
							expect(resource.id).toBe('a')
