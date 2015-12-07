
# TODO: test isRTL?

describe 'basic-view event drag-n-drop', ->
	pushOptions
		droppable: true
		now: '2015-11-29'
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		defaultView: 'basicWeek'

	describeTimezones (tz) ->

		describeOptions {
			'resources above dates': { groupByResource: true }
			'dates above resources': { groupByDateAndResource: true }
		}, ->

			it 'allows dropping onto a resource', (done) ->
				dragEl = $('<a' +
					' class="external-event fc-event"' +
					' style="width:100px"' +
					' data-event=\'{"title":"my external event","start":"05:00"}\'' +
					'>external</a>')
					.appendTo('body')
					.draggable()

				initCalendar
					eventAfterAllRender: oneCall ->
						$('.external-event').simulate 'drag',
							localPoint: { left: '50%', top: 0 }
							end: getResourceDayGridDayEls('a', '2015-12-01').eq(0)
							callback: ->
								expect(dropSpy).toHaveBeenCalled()
								expect(receiveSpy).toHaveBeenCalled()
								dragEl.remove()
								done()
					drop:
						dropSpy = spyCall (date) ->
							# TODO: fix buggy behavior
							# https://github.com/fullcalendar/fullcalendar/issues/2955
							#expect(date).toEqualMoment('2015-12-01')
					eventReceive:
						receiveSpy = spyCall (event) ->
							expect(event.title).toBe('my external event')
							expect(event.start).toEqualMoment(tz.moment('2015-12-01T05:00:00'))
							expect(event.end).toBe(null)
							resource = currentCalendar.getEventResource(event)
							expect(resource.id).toBe('a')
