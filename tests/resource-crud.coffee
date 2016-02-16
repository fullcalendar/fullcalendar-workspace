###
getResourceById
getResources
addResource
removeResource
refetchResources
getResourceEvents
###

describe 'resource crudding', ->

	pushOptions
		defaultView: 'timelineDay'

	describe 'getResourceById', ->

		describe 'when given a resource with an alphabetical id', ->

			it 'queries correctly', (done) ->
				initCalendar
					resources: [
						{ id: 'a', title: 'room a' }
					]
					viewRender: ->
						resource = currentCalendar.getResourceById('a')
						expect(resource.title).toBe('room a')
						done()

		describe 'when given a resource with a numeric id', ->

			it 'queries correctly with a number', (done) ->
				initCalendar
					resources: [
						{ id: 1, title: 'room 1' }
					]
					viewRender: ->
						resource = currentCalendar.getResourceById(1)
						expect(resource.title).toBe('room 1')
						done()

			it 'queries correctly with a string', (done) ->
				initCalendar
					resources: [
						{ id: 1, title: 'room 1' }
					]
					viewRender: ->
						resource = currentCalendar.getResourceById('1')
						expect(resource.title).toBe('room 1')
						done()

	describe 'getResources', ->

		it 'gets flat top-level resources', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'room a' }
					{ id: 'b', title: 'room b' }
				]
				viewRender: ->
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(2)
					expect(resources[0].title).toBe('room a')
					expect(resources[1].title).toBe('room b')
					done()

		it 'gets nested top-level resources', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'room a' }
					{ id: 'b', title: 'room b', children: [
						{ id: 'b1', title: 'room b1' }
					] }
				]
				viewRender: ->
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(2)
					expect(resources[0].title).toBe('room a')
					expect(resources[1].title).toBe('room b')
					expect(resources[1].children[0].title).toBe('room b1')
					done()

	describe 'addResource', ->

		it 'correctly adds a resouce', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'room a' }
				]
				viewRender: ->
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(1)
					currentCalendar.addResource({ id: 'b', title: 'room b' })
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(2)
					expect(resources[1].title).toBe('room b')
					done()

	describe 'removeResource', ->

		it 'works when given an ID', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'room a' }
					{ id: 'b', title: 'room b' }
				]
				viewRender: ->
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(2)
					currentCalendar.removeResource('a')
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(1)
					expect(resources[0].title).toBe('room b')
					done()

		it 'works when given a resource object', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'room a' }
					{ id: 'b', title: 'room b' }
				]
				viewRender: ->
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(2)
					currentCalendar.removeResource(resources[0])
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(1)
					expect(resources[0].title).toBe('room b')
					done()

	describe 'refetchResources', ->

		it 'will replace previous resources', (done) ->
			callCnt = 0
			initCalendar
				resources: (callback) ->
					res =
						if not callCnt
							[
								{ id: 'a', title: 'room a' }
								{ id: 'b', title: 'room b' }
							]
						else
							[
								{ id: 'c', title: 'room c' }
							]
					callCnt += 1
					callback(res)
				viewRender: ->
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(2)
					expect(resources[0].title).toBe('room a')
					currentCalendar.refetchResources()
					resources = currentCalendar.getResources()
					expect(resources.length).toBe(1)
					expect(resources[0].title).toBe('room c')
					done()


	describe 'getResourceEvents', ->
		pushOptions
		defaultView: 'timelineMonth'
		now: '2015-11-17'

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
