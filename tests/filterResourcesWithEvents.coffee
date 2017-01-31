describe 'filterResourcesWithEvents', ->
	pushOptions
		now: '2016-12-04'
		scrollTime: '00:00'
		filterResourcesWithEvents: true


	getResourceArray = ->
		[
			{ id: 'a', title: 'resource a' }
			{ id: 'b', title: 'resource b' }
			{ id: 'c', title: 'resource c' }
			{ id: 'd', title: 'resource d' }
		]

	getResourceFunc = (timeout=100) ->
		(callback) ->
			setTimeout ->
				callback(getResourceArray())
			, timeout


	describeValues {
		'when timeline view': { view: 'timelineDay', getResourceIds: getTimelineResourceIds }
		'when agenda view': { view: 'agendaDay', getResourceIds: getHeadResourceIds }
	}, (settings) ->
		pushOptions
			defaultView: settings.view


		it 'whitelists with immediately fetched events', ->
			initCalendar
				resources: getResourceArray()
				events: [
					{ title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' }
					{ title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' }
				]

			expect(settings.getResourceIds()).toEqual([ 'b', 'd' ])
			expect($('.fc-event').length).toBe(2)


		it 'whitelists with async-fetched events', (done) ->
			initCalendar
				resources: getResourceFunc()
				events: [
					{ title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' }
					{ title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' }
				]
				eventAfterAllRender: ->
					expect(settings.getResourceIds()).toEqual([ 'b', 'd' ])
					expect($('.fc-event').length).toBe(2)
					done()

			# no resources/events initially
			expect(settings.getResourceIds()).toEqual([ ])
			expect($('.fc-event').length).toBe(0)


	describe 'when timeline view', ->
		pushOptions
			defaultView: 'timelineDay'


		it 'adjusts when given new events', ->
			initCalendar
				resources: getResourceArray()
				events: [
					{ title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' }
				]
			expect(getTimelineResourceIds()).toEqual([ 'b' ])
			currentCalendar.renderEvent({ title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' })
			expect(getTimelineResourceIds()).toEqual([ 'b', 'd' ])


		it 'filters addResource calls', ->
			initCalendar
				resources: getResourceArray()
				events: [
					{ title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' }
					{ title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' }
				]
			expect(getTimelineResourceIds()).toEqual([ 'b', 'd' ])

			currentCalendar.addResource({ id: 'e', title: 'resource e' })
			expect(getTimelineResourceIds()).toEqual([ 'b', 'd' ])

			currentCalendar.renderEvent({ title: 'event 3', start: '2016-12-04T02:00:00', resourceId: 'e' })
			expect(getTimelineResourceIds()).toEqual([ 'b', 'd', 'e' ])


		it 'displays empty parents if children have events', ->
			initCalendar
				resources: [
					{ id: 'a', title: 'resource a' }
					{ id: 'b', title: 'resource b', children: [
						{ id: 'b1', title: 'resource b1' }
						{ id: 'b2', title: 'resource b2' }
					] }
				]
				events: [
					{ title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b2' }
				]
			expect(getTimelineResourceIds()).toEqual([ 'b', 'b2' ])
