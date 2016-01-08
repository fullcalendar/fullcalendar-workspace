###
getResourceEvents
###

describe 'resource events', ->
	pushOptions
		defaultView: 'timelineMonth'
		now: '2015-11-17'

	describe 'getResourceEvents', ->

		describe 'when given a resourceId', ->

			it 'returns the associated events', (done) ->
				initCalendar
					resources: [
						{ id: 'a', title: 'room a' }
						{ id: 'b', title: 'room b' }
					]
					events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17'
								end: '2015-11-18'
								resourceId: 'a'
							}
						]
					eventAfterAllRender: ->
						events = currentCalendar.getResourceEvents('a')
						expect(events.length).toBe(1)
						done()

		describe 'when given a resourceId and event has multiple resources', ->

			it 'returns the associated events', (done) ->
				initCalendar
					resources: [
						{ id: 'a', title: 'room a' }
						{ id: 'b', title: 'room b' }
					]
					events: [
							{
								title: 'event 1'
								className: 'event1'
								start: '2015-11-17'
								end: '2015-11-18'
								resourceIds: ['a','b']
							}
						]
					eventAfterAllRender: ->
						events = currentCalendar.getResourceEvents('a')
						expect(events.length).toBe(1)
						done()

	
