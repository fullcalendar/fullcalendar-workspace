###
getResourceEvents
getEventResource
eventResourceField
###

describe 'associating resources with event', ->

	pushOptions
		defaultView: 'timelineDay'
		defaultDate: '2015-07-11'

	it 'works with an Event object\'s resourceId', (done) ->
		initCalendar
			resources: [
				{ id: 'a', title: 'room a' }
				{ id: 'b', title: 'room b' }
			]
			events: [
				{ id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' }
				{ id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
			]
			eventAfterAllRender: ->
				roomAEvents = currentCalendar.getResourceEvents('a')
				expect(roomAEvents.length).toBe(1)
				expect(roomAEvents[0].title).toBe('event 1')
				roomBEvents = currentCalendar.getResourceEvents('b')
				expect(roomBEvents.length).toBe(1)
				expect(roomBEvents[0].title).toBe('event 2')
				event1Resource = currentCalendar.getEventResource('1')
				expect(event1Resource.title).toBe('room a')
				event2Resource = currentCalendar.getEventResource('2')
				expect(event2Resource.title).toBe('room b')
				expect($('.event1').length).toBe(1)
				expect($('.event2').length).toBe(1)
				done()


	it 'works with integers', (done) ->
		initCalendar
			resources: [
				{ id: 0, title: 'room a' }
				{ id: 1, title: 'room b' }
			]
			events: [
				{ id: 0, title: 'event 1', resourceId: 0, className: 'event1', start: '2015-07-11T09:00:00' }
				{ id: 1, title: 'event 2', resourceId: 1, className: 'event2', start: '2015-07-11T10:00:00' }
			]
			eventAfterAllRender: ->
				roomAEvents = currentCalendar.getResourceEvents(0)
				expect(roomAEvents.length).toBe(1)
				expect(roomAEvents[0].title).toBe('event 1')
				roomBEvents = currentCalendar.getResourceEvents(1)
				expect(roomBEvents.length).toBe(1)
				expect(roomBEvents[0].title).toBe('event 2')
				event1Resource = currentCalendar.getEventResource(0)
				expect(event1Resource.title).toBe('room a')
				event2Resource = currentCalendar.getEventResource(1)
				expect(event2Resource.title).toBe('room b')
				expect($('.event1').length).toBe(1)
				expect($('.event2').length).toBe(1)
				done()

	it 'works with a custom eventResourceField', (done) ->
		initCalendar
			eventResourceField: 'roomId'
			resources: [
				{ id: 'a', title: 'room a' }
				{ id: 'b', title: 'room b' }
			]
			events: [
				{ id: '1', title: 'event 1', roomId: 'a', className: 'event1', start: '2015-07-11T09:00:00' }
				{ id: '2', title: 'event 2', roomId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
			]
			eventAfterAllRender: ->
				roomAEvents = currentCalendar.getResourceEvents('a')
				expect(roomAEvents.length).toBe(1)
				expect(roomAEvents[0].title).toBe('event 1')
				roomBEvents = currentCalendar.getResourceEvents('b')
				expect(roomBEvents.length).toBe(1)
				expect(roomBEvents[0].title).toBe('event 2')
				event1Resource = currentCalendar.getEventResource('1')
				expect(event1Resource.title).toBe('room a')
				event2Resource = currentCalendar.getEventResource('2')
				expect(event2Resource.title).toBe('room b')
				expect($('.event1').length).toBe(1)
				expect($('.event2').length).toBe(1)
				done()

	it 'works asynchronously with resource delay', (done) ->
		initCalendar
			resources: (callback) ->
				setTimeout(
					->
						callback([
							{ id: 'a', title: 'room a' }
							{ id: 'b', title: 'room b' }
						])
					200
				)
			events: (start, end, timezone, callback) ->
				callback([
					{ id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' }
					{ id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
				])
			eventAfterAllRender: ->
				roomAEvents = currentCalendar.getResourceEvents('a')
				expect(roomAEvents.length).toBe(1)
				expect(roomAEvents[0].title).toBe('event 1')
				roomBEvents = currentCalendar.getResourceEvents('b')
				expect(roomBEvents.length).toBe(1)
				expect(roomBEvents[0].title).toBe('event 2')
				event1Resource = currentCalendar.getEventResource('1')
				expect(event1Resource.title).toBe('room a')
				event2Resource = currentCalendar.getEventResource('2')
				expect(event2Resource.title).toBe('room b')
				expect($('.event1').length).toBe(1)
				expect($('.event2').length).toBe(1)
				done()

	it 'works asynchronously with events delay', (done) ->
		initCalendar
			resources: (callback) ->
				callback([
					{ id: 'a', title: 'room a' }
					{ id: 'b', title: 'room b' }
				])
			events: (start, end, timezone, callback) ->
				setTimeout(
					->
						callback([
							{ id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' }
							{ id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
						])
					200
				)
			eventAfterAllRender: ->
				roomAEvents = currentCalendar.getResourceEvents('a')
				expect(roomAEvents.length).toBe(1)
				expect(roomAEvents[0].title).toBe('event 1')
				roomBEvents = currentCalendar.getResourceEvents('b')
				expect(roomBEvents.length).toBe(1)
				expect(roomBEvents[0].title).toBe('event 2')
				event1Resource = currentCalendar.getEventResource('1')
				expect(event1Resource.title).toBe('room a')
				event2Resource = currentCalendar.getEventResource('2')
				expect(event2Resource.title).toBe('room b')
				expect($('.event1').length).toBe(1)
				expect($('.event2').length).toBe(1)
				done()
