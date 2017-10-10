
describe 'timeline businessHours', ->
	pushOptions
		defaultView: 'timelineDay'
		now: '2016-02-15'
		scrollTime: '00:00'

	describeOptions 'isRTL', {
		'when LTR': false
		'when RTL': true
	}, ->

		it 'renders when on a day with business hours', (done) ->
			initCalendar
				businessHours:
					start: '10:00'
					end: '16:00'
				slotDuration: { hours: 1 }
				viewRender: ->
					expect10to4()
					done()

		it 'renders all-day on a day completely outside of business hours', (done) ->
			initCalendar
				now: '2016-02-14' # weekend
				businessHours: {
					start: '10:00'
					end: '16:00'
				}
				slotDuration: { hours: 1 }
				viewRender: ->
					expect(isTimelineNonBusinessSegsRendered([
						{ start: '2016-02-14T00:00', end: '2016-02-15T00:00' }
					])).toBe(true)
					done()

		it 'renders once even with resources', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'a' }
					{ id: 'b', title: 'b' }
					{ id: 'c', title: 'c' }
				]
				businessHours: true
				viewRender: ->
					expect9to5()
					done()

		it 'render differently with resource override', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'a' }
					{ id: 'b', title: 'b', businessHours: { start: '02:00', end: '22:00' } }
					{ id: 'c', title: 'c' }
				]
				businessHours: true
				viewRender: ->
					expectResourceOverride()
					done()

		it 'renders dynamically with resource override', (done) ->
			specialResource = { id: 'b', title: 'b', businessHours: { start: '02:00', end: '22:00' } }
			initCalendar
				resources: [
					{ id: 'a', title: 'a' }
					specialResource
					{ id: 'c', title: 'c' }
				]
				businessHours: true
				viewRender: ->
					expectResourceOverride()
					setTimeout ->
						currentCalendar.removeResource(specialResource)
						expect9to5()
						currentCalendar.addResource(specialResource)
						expectResourceOverride()
						done()

		it 'renders dynamically with resource override amidst other custom rows', (done) ->
			initCalendar
				resources: [
					{ id: 'a', title: 'a', businessHours: { start: '03:00', end: '21:00' } }
				]
				businessHours: true
				viewRender: ->
					expect(isResourceTimelineNonBusinessSegsRendered([
						{ resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T03:00' }
						{ resourceId: 'a', start: '2016-02-15T21:00', end: '2016-02-16T00:00' }
					])).toBe(true)
					setTimeout ->
						currentCalendar.addResource({ id: 'b', title: 'b', businessHours: { start: '02:00', end: '22:00' } })
						expect(isResourceTimelineNonBusinessSegsRendered([
							{ resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T03:00' }
							{ resourceId: 'a', start: '2016-02-15T21:00', end: '2016-02-16T00:00' }
							{ resourceId: 'b', start: '2016-02-15T00:00', end: '2016-02-15T02:00' }
							{ resourceId: 'b', start: '2016-02-15T22:00', end: '2016-02-16T00:00' }
						])).toBe(true)
						done()

	describe 'when resource initially contracted', ->
		pushOptions
			resourcesInitiallyExpanded: false

		describe 'with a business hour override', ->
			pushOptions
				resources: [
					{ id: 'a', title: 'a', children: [
						{ id: 'a1', title: 'a1', businessHours: { start: '02:00', end: '22:00' } }
					] }
				]

			it 'renders when expanded', (done) ->
				initCalendar()
				clickExpander()
				setTimeout -> # wait for animation to finish
					expect(isResourceTimelineNonBusinessSegsRendered([
						{ resourceId: 'a1', start: '2016-02-15T00:00', end: '2016-02-15T02:00' }
						{ resourceId: 'a1', start: '2016-02-15T22:00', end: '2016-02-16T00:00' }
					])).toBe(true)
					done()
				, 500

	clickExpander = ->
		$('.fc-expander').simulate('click')

	expect9to5 = ->
		expect(isTimelineNonBusinessSegsRendered([
			{ start: '2016-02-15T00:00', end: '2016-02-15T09:00' }
			{ start: '2016-02-15T17:00', end: '2016-02-16T00:00' }
		])).toBe(true)

	expect10to4 = ->
		expect(isTimelineNonBusinessSegsRendered([
			{ start: '2016-02-15T00:00', end: '2016-02-15T10:00' }
			{ start: '2016-02-15T16:00', end: '2016-02-16T00:00' }
		])).toBe(true)

	expectResourceOverride = -> # one resource 2am - 10pm, the rest 9am - 5pm
		expect(isResourceTimelineNonBusinessSegsRendered([
			{ resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T09:00' }
			{ resourceId: 'a', start: '2016-02-15T17:00', end: '2016-02-16T00:00' }
			{ resourceId: 'b', start: '2016-02-15T00:00', end: '2016-02-15T02:00' }
			{ resourceId: 'b', start: '2016-02-15T22:00', end: '2016-02-16T00:00' }
			{ resourceId: 'c', start: '2016-02-15T00:00', end: '2016-02-15T09:00' }
			{ resourceId: 'c', start: '2016-02-15T17:00', end: '2016-02-16T00:00' }
		])).toBe(true)

	isTimelineNonBusinessSegsRendered = (segs) ->
		doElsMatchSegs($('.fc-timeline .fc-nonbusiness'), segs, getTimelineRect)

	isResourceTimelineNonBusinessSegsRendered = (segs) ->
		doElsMatchSegs($('.fc-timeline .fc-nonbusiness'), segs, getResourceTimelineRect)
