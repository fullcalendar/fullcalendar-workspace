
# TODO: test isRTL?

describe 'agenda-view event drag-n-drop', ->
	pushOptions
		droppable: true
		now: '2015-11-29'
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		defaultView: 'agendaWeek'
		scrollTime: '00:00'

	describeTimezones (tz) ->

		describeOptions {
			'resources above dates': { groupByResource: true }
			'dates above resources': { groupByDateAndResource: true }
		}, ->

			it 'allows dropping onto a resource', (done) ->
				dragEl = $('<a' +
					' class="external-event fc-event"' +
					' style="width:100px"' +
					' data-event=\'{"title":"my external event"}\'' +
					'>external</a>')
					.appendTo('body')
					.draggable()

				initCalendar
					eventAfterAllRender: oneCall ->
						$('.external-event').simulate 'drag',
							localPoint: { left: '50%', top: 0 }
							end: getResourceTimeGridPoint('a', '2015-12-01T05:00:00')
							callback: ->
								expect(dropSpy).toHaveBeenCalled()
								expect(receiveSpy).toHaveBeenCalled()
								dragEl.remove()
								done()
					drop:
						dropSpy = spyCall (date) ->
							expect(date).toEqualMoment(tz.moment('2015-12-01T05:00:00'))
					eventReceive:
						receiveSpy = spyCall (event) ->
							expect(event.title).toBe('my external event')
							expect(event.start).toEqualMoment(tz.moment('2015-12-01T05:00:00'))
							expect(event.end).toBe(null)
							resource = currentCalendar.getEventResource(event)
							expect(resource.id).toBe('a')
