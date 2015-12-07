
# TODO: test isRTL?

describe 'agenda-view event drag-n-drop', ->
	pushOptions
		editable: true
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

			it 'allows switching date and resource', (done) ->
				initCalendar
					events: [
						{ title: 'event0', className: 'event0', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }
					]
					eventAfterAllRender: oneCall ->
						$('.event0').simulate 'drag',
							localPoint:
								top: 1 # fudge for IE10 :(
								left: '50%'
							end: getResourceTimeGridPoint('a', '2015-12-01T05:00:00')
							callback: ->
								expect(dropSpy).toHaveBeenCalled()
								done()
					eventDrop:
						dropSpy = spyCall (event) ->
							expect(event.start).toEqualMoment(tz.moment('2015-12-01T05:00:00'))
							expect(event.end).toEqualMoment(tz.moment('2015-12-01T06:00:00'))
							resource = currentCalendar.getEventResource(event)
							expect(resource.id).toBe('a')
