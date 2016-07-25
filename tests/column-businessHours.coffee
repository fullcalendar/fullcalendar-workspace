
describe 'vresource businessHours', ->
	pushOptions
		now: '2015-11-18'
		businessHours: true
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]

	describeOptions 'isRTL', {
		'when LTR': false
		'when RTL': true
	}, (isRTL) ->

		describe 'for basicWeek', ->
			pushOptions
				defaultView: 'basicWeek'

			describeOptions {
				'when resources above dates': { groupByResource: true }
				'when dates above resources': { groupByDateAndResource: true }
			}, ->

				it 'greys out sat and sun', (done) ->
					initCalendar
						viewRender: ->
							expect(isDayGridNonBusinessSegsRendered([
								{ resourceId: 'a', date: '2015-11-15' }
								{ resourceId: 'a', date: '2015-11-21' }
								{ resourceId: 'b', date: '2015-11-15' }
								{ resourceId: 'b', date: '2015-11-21' }
							])).toBe(true)
							done()

		describe 'for agendaWeek', ->
			pushOptions
				defaultView: 'agendaWeek'

			describeOptions {
				'when resources above dates': { groupByResource: true }
				'when dates above resources': { groupByDateAndResource: true }
			}, ->

				it 'greys out sat and sun', (done) ->
					initCalendar
						viewRender: ->
							expect(isTimeGridNonBusinessSegsRendered([
								# sun
								{ resourceId: 'a', start: '2015-11-15T00:00:00', end: '2015-11-16T00:00:00' }
								# mon
								{ resourceId: 'a', start: '2015-11-16T00:00:00', end: '2015-11-16T09:00:00' }
								{ resourceId: 'a', start: '2015-11-16T17:00:00', end: '2015-11-17T00:00:00' }
								# tue
								{ resourceId: 'a', start: '2015-11-17T00:00:00', end: '2015-11-17T09:00:00' }
								{ resourceId: 'a', start: '2015-11-17T17:00:00', end: '2015-11-18T00:00:00' }
								# wed
								{ resourceId: 'a', start: '2015-11-18T00:00:00', end: '2015-11-18T09:00:00' }
								{ resourceId: 'a', start: '2015-11-18T17:00:00', end: '2015-11-19T00:00:00' }
								# thu
								{ resourceId: 'a', start: '2015-11-19T00:00:00', end: '2015-11-19T09:00:00' }
								{ resourceId: 'a', start: '2015-11-19T17:00:00', end: '2015-11-20T00:00:00' }
								# fru
								{ resourceId: 'a', start: '2015-11-20T00:00:00', end: '2015-11-20T09:00:00' }
								{ resourceId: 'a', start: '2015-11-20T17:00:00', end: '2015-11-21T00:00:00' }
								# sat
								{ resourceId: 'a', start: '2015-11-21T00:00:00', end: '2015-11-22T00:00:00' }
								# sun
								{ resourceId: 'b', start: '2015-11-15T00:00:00', end: '2015-11-16T00:00:00' }
								# mom
								{ resourceId: 'b', start: '2015-11-16T00:00:00', end: '2015-11-16T09:00:00' }
								{ resourceId: 'b', start: '2015-11-16T17:00:00', end: '2015-11-17T00:00:00' }
								# tue
								{ resourceId: 'b', start: '2015-11-17T00:00:00', end: '2015-11-17T09:00:00' }
								{ resourceId: 'b', start: '2015-11-17T17:00:00', end: '2015-11-18T00:00:00' }
								# wed
								{ resourceId: 'b', start: '2015-11-18T00:00:00', end: '2015-11-18T09:00:00' }
								{ resourceId: 'b', start: '2015-11-18T17:00:00', end: '2015-11-19T00:00:00' }
								# thu
								{ resourceId: 'b', start: '2015-11-19T00:00:00', end: '2015-11-19T09:00:00' }
								{ resourceId: 'b', start: '2015-11-19T17:00:00', end: '2015-11-20T00:00:00' }
								# fri
								{ resourceId: 'b', start: '2015-11-20T00:00:00', end: '2015-11-20T09:00:00' }
								{ resourceId: 'b', start: '2015-11-20T17:00:00', end: '2015-11-21T00:00:00' }
								# sat
								{ resourceId: 'b', start: '2015-11-21T00:00:00', end: '2015-11-22T00:00:00' }
							])).toBe(true)
							done()


	isDayGridNonBusinessSegsRendered = (expectedSegs) ->
		segEls = $('.fc-day-grid .fc-nonbusiness')
		unmatchedSegRects = getBoundingRects(segEls)

		if unmatchedSegRects.length != expectedSegs.length
			return false

		for expectedSeg, i in expectedSegs
			headEl = getHeadResourceTh(expectedSeg.resourceId, expectedSeg.date)
			headRect = getBoundingRect(headEl) # expected

			# find an element with matching horizontal coords
			found = false
			for actualRect, i in unmatchedSegRects
				if isRectsHSimilar(actualRect, headRect)
					unmatchedSegRects.splice(i, 1) # remove
					found = true
					break

			if not found
				return false

		true # every seg was found


	isTimeGridNonBusinessSegsRendered = (expectedSegs) ->
		segEls = $('.fc-time-grid .fc-nonbusiness')
		unmatchedSegRects = getBoundingRects(segEls)

		if unmatchedSegRects.length != expectedSegs.length
			return false

		for expectedSeg in expectedSegs
			expectedSegRect = getResourceTimeGridRect(
				expectedSeg.resourceId
				expectedSeg.start
				expectedSeg.end
			)

			# find an element with rectangle that matches
			found = false
			for actualRect, i in unmatchedSegRects
				if isRectsSimilar(actualRect, expectedSegRect)
					unmatchedSegRects.splice(i, 1) # remove
					found = true
					break

			if not found
				return false

		true # every seg was found
