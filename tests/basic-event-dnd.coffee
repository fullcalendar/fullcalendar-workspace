
# TODO: test isRTL?

describe 'basic-view event drag-n-drop', ->
	pushOptions
		editable: true
		now: '2015-11-29'
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		defaultView: 'basicWeek'

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

		describeOptions {
			'resources above dates': { groupByResource: true }
			'dates above resources': { groupByDateAndResource: true }
		}, ->

			it 'allows switching date and resource', (done) ->
				initCalendar
					events: [
						{ title: 'event0', className: 'event0', start: '2015-11-30T12:00:00', resourceId: 'b' }
					]
					eventAfterAllRender: oneCall ->
						$('.event0').simulate 'drag',
							endEl: getDayGridResourceRect('Resource A', '2015-12-01').node
							callback: ->
								expect(dropSpy).toHaveBeenCalled()
								done()
					eventDrop:
						dropSpy = spyCall (event) ->
							expect(event.start).toEqualMoment(tz.moment('2015-12-01T12:00:00'))
							expect(event.end).toBe(null)
							resource = currentCalendar.getEventResource(event)
							expect(resource.id).toBe('a')
