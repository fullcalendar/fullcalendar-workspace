fdescribe 'refetchResourcesOnNavigate', ->
	pushOptions
		refetchResourcesOnNavigate: true
		now: '2016-12-04'
		scrollTime: '00:00'
		events: [
			{ title: 'event1', start: '2016-12-04T01:00:00', resourceId: 'a', className: 'day1event' }
			{ title: 'event2', start: '2016-12-04T02:00:00', resourceId: 'b', className: 'day1event' }
			{ title: 'event3', start: '2016-12-05T03:00:00', resourceId: 'a', className: 'day2event' }
			{ title: 'event4', start: '2016-12-05T04:00:00', resourceId: 'b', className: 'day2event' }
		]

	describeValues {
		'with timeline view':
			view: 'timelineDay'
			getResourceTitles: getTimelineResourceTitles
		'with resource agenda view':
			view: 'agendaDay'
			getResourceTitles: getHeadResourceTitles
		'with resource basic view':
			view: 'basicDay'
			getResourceTitles: getHeadResourceTitles
	}, (settings) ->
		pushOptions
			defaultView: settings.view

		it 'refetches resources when navigating', ->
			resourceCallCnt = 0

			initCalendar
				resources: (callback) ->
					resourceCallCnt += 1
					callback([
						{ title: 'resource a-' + resourceCallCnt, id: 'a' }
						{ title: 'resource b-' + resourceCallCnt, id: 'b' }
					])

			expect(resourceCallCnt).toBe(1)
			expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
			expect($('.day1event').length).toBe(2)

			currentCalendar.next()

			expect(resourceCallCnt).toBe(2)
			expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
			expect($('.day1event').length).toBe(0)
			expect($('.day2event').length).toBe(2)


		it 'refetches async resources and waits to render events', (done) ->
			resourceCallCnt = 0
			eventRenderingCnt = 0

			initCalendar
				resources: (callback) ->
					resourceCallCnt += 1
					setTimeout ->
						callback([
							{ title: 'resource a-' + resourceCallCnt, id: 'a' }
							{ title: 'resource b-' + resourceCallCnt, id: 'b' }
						])
					, 100

				eventAfterAllRender: ->
					eventRenderingCnt += 1

					# step 2
					if eventRenderingCnt == 1
						expect(resourceCallCnt).toBe(1)
						expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
						expect($('.day1event').length).toBe(2)
						currentCalendar.next()

					# step 3
					else if eventRenderingCnt == 2
						# if the 2nd day's events rendered without waiting for the new resources,
						# then you'd still have resource a-1 and b-1

						expect(resourceCallCnt).toBe(2)
						expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
						expect($('.day1event').length).toBe(0)
						expect($('.day2event').length).toBe(2)
						done()

			# step 1 (nothing rendered initially)
			expect(resourceCallCnt).toBe(1)
			expect(settings.getResourceTitles()).toEqual([ ])
			expect($('.day1event').length).toBe(0)


		it 'calls viewRender after resources rendered for each navigation', (done) ->
			resourceCallCnt = 0
			viewRenderCallCnt = 0

			initCalendar
				resources: (callback) ->
					resourceCallCnt += 1
					setTimeout ->
						callback([
							{ title: 'resource a-' + resourceCallCnt, id: 'a' }
							{ title: 'resource b-' + resourceCallCnt, id: 'b' }
						])
					, 100

				viewRender: ->
					viewRenderCallCnt += 1

					if viewRenderCallCnt == 1
						expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
						currentCalendar.next()

					else if viewRenderCallCnt == 2
						expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
						done()


	it 'refetches resources on view switch', ->
		resourceCallCnt = 0

		initCalendar
			defaultView: 'agendaDay'
			views:
				agendaTwoDay:
					type: 'agenda'
					duration: { days: 2 }
					groupByResource: true
			resources: (callback) ->
				resourceCallCnt += 1
				callback([
					{ title: 'resource a-' + resourceCallCnt, id: 'a' }
					{ title: 'resource b-' + resourceCallCnt, id: 'b' }
				])

		expect(resourceCallCnt).toBe(1)
		expect(getHeadResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
		expect($('.day1event').length).toBe(2)

		currentCalendar.changeView('agendaTwoDay')

		expect(resourceCallCnt).toBe(2)
		expect(getHeadResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
		expect($('.day1event').length).toBe(2)
		expect($('.day2event').length).toBe(2)
