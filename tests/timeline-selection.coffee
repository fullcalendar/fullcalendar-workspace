
describe 'timeline selection', ->
	pushOptions
		now: '2015-11-28'
		scrollTime: '00:00'
		selectable: true
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

						it 'reports selection with no resource', (done) ->
							selectCalled = false
							initCalendar
								eventAfterAllRender: ->
									slatEl = getTimelineSlatEl('2015-11-28T04:00:00')
									slatEl.simulate 'drag',
										end: getTimelineSlatEl('2015-11-28T07:00:00')
										callback: ->
											expect(selectCalled).toBe(true)
											done()
								select: (start, end, jsEvent, view, resource) ->
									selectCalled = true
									expect(start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
									expect(end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
									expect(typeof jsEvent).toBe('object')
									expect(typeof view).toBe('object')
									expect(resource).toBeFalsy()

					describe 'when resources', ->

						it 'won\'t report anything if not selected on resource', (done) ->
							selectCalled = false
							initCalendar
								eventAfterAllRender: ->
									slatEl = getTimelineSlatEl('2015-11-28T04:00:00')
									slatEl.simulate 'drag',
										end: getTimelineSlatEl('2015-11-28T07:00:00')
										callback: ->
											expect(selectCalled).toBe(false)
											done()
								select: (date, jsEvent, view, resource) ->
									selectCalled = true

						it 'reports selection on a resource', (done) ->
							selectCalled = false
							initCalendar
								eventAfterAllRender: ->
									$.simulateByPoint 'drag',
										point: getResourceTimelinePoint('b', '2015-11-28T04:00:00')
										end: getResourceTimelinePoint('b', '2015-11-28T07:00:00')
										callback: ->
											expect(selectCalled).toBe(true)
											done()
								select: (start, end, jsEvent, view, resource) ->
									selectCalled = true
									expect(start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
									expect(end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
									expect(typeof jsEvent).toBe('object')
									expect(typeof view).toBe('object')
									expect(resource.id).toBe('b')

						it 'reports selection across resources', (done) ->
							selectCalled = false
							initCalendar
								eventAfterAllRender: ->
									$.simulateByPoint 'drag',
										point: getResourceTimelinePoint('b', '2015-11-28T04:00:00')
										end: getResourceTimelinePoint('a', '2015-11-28T07:00:00')
										callback: ->
											expect(selectCalled).toBe(true)
											done()
								select: (start, end, jsEvent, view, resource) ->
									selectCalled = true
									expect(start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
									expect(end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
									expect(typeof jsEvent).toBe('object')
									expect(typeof view).toBe('object')
									expect(resource.id).toBe('b')

				describe 'when snap smaller than slots', ->
					pushOptions
						slotDuration: '00:30'
						snapDuration: '00:15'

					it 'reports a smaller granularity', (done) ->
						selectCalled = false
						initCalendar
							eventAfterAllRender: ->
								$.simulateByPoint 'drag',
									point: getResourceTimelinePoint('b', '2015-11-28T04:00:00', 0.5) # +1/2 slot = 15 mins
									end: getResourceTimelinePoint('b', '2015-11-28T07:30:00')
									callback: ->
										expect(selectCalled).toBe(true)
										done()
							select: (start, end, jsEvent, view, resource) ->
								selectCalled = true
								expect(start).toEqualMoment(tz.moment('2015-11-28T04:15:00'))
								expect(end).toEqualMoment(tz.moment('2015-11-28T07:45:00'))
								expect(typeof jsEvent).toBe('object')
								expect(typeof view).toBe('object')
								expect(resource.id).toBe('b')

		describe 'when day scale', ->
			pushOptions
				defaultView: 'timelineMonth'
				slotDuration: { days: 1 }

			it 'reports untimed dates', (done) ->
				selectCalled = false
				initCalendar
					eventAfterAllRender: ->
						$.simulateByPoint 'drag',
							point: getResourceTimelinePoint('a', '2015-11-03')
							end: getResourceTimelinePoint('a', '2015-11-05')
							callback: ->
								expect(selectCalled).toBe(true)
								done()
					select: (start, end, jsEvent, view, resource) ->
						selectCalled = true
						expect(start).toEqualMoment('2015-11-03')
						expect(end).toEqualMoment('2015-11-06')
						expect(typeof jsEvent).toBe('object')
						expect(typeof view).toBe('object')
						expect(resource.id).toBe('a')

		describe 'when week scale', ->
			pushOptions
				defaultView: 'timelineYear'
				slotDuration: { weeks: 1 }

			it 'reports untimed dates', (done) ->
				selectCalled = false
				initCalendar
					eventAfterAllRender: ->
						$.simulateByPoint 'drag',
							point: getResourceTimelinePoint('a', '2015-01-18')
							end: getResourceTimelinePoint('a', '2015-02-08')
							callback: ->
								expect(selectCalled).toBe(true)
								done()
					select: (start, end, jsEvent, view, resource) ->
						selectCalled = true
						expect(start).toEqualMoment('2015-01-18')
						expect(end).toEqualMoment('2015-02-15')
						expect(typeof jsEvent).toBe('object')
						expect(typeof view).toBe('object')
						expect(resource.id).toBe('a')

	it 'reports selection on a resource via touch', (done) ->
		selectCalled = false
		initCalendar
			isTouch: true
			longPressDelay: 100
			defaultView: 'timelineDay'
			eventAfterAllRender: ->
				$.simulateByPoint 'drag',
					isTouch: true
					delay: 200
					point: getResourceTimelinePoint('b', '2015-11-28T04:00:00')
					end: getResourceTimelinePoint('b', '2015-11-28T07:00:00')
					callback: ->
						expect(selectCalled).toBe(true)
						done()
			select: (start, end, jsEvent, view, resource) ->
				selectCalled = true
				expect(start).toEqualMoment('2015-11-28T04:00:00')
				expect(end).toEqualMoment('2015-11-28T07:30:00')
				expect(typeof jsEvent).toBe('object')
				expect(typeof view).toBe('object')
				expect(resource.id).toBe('b')
