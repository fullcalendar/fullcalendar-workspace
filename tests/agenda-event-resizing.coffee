
describe 'agenda-view event resizing', ->
	pushOptions
		now: '2015-11-28'
		scrollTime: '00:00'
		editable: true
		resources: [
			{ id: 'a', title: 'Resource A' }
			{ id: 'b', title: 'Resource B' }
		]
		views:
			agendaThreeDay:
				type: 'agenda'
				duration: { days: 3 }

	describe 'when there are no resource columns', ->
		pushOptions
			defaultView: 'agendaWeek'
			groupByResource: false

		it 'allows non-resource resize', (done) ->
			initCalendar
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-23T02:00:00', end: '2015-11-23T03:00:00' }
				]
				eventAfterAllRender: oneCall ->
					$('.event1').simulate('mouseover') # resizer only shows on hover
					$('.event1 .fc-resizer')
						.simulate 'drag',
							end: getTimeGridPoint('2015-11-23T04:00:00')
							callback: ->
								expect(resizeSpy).toHaveBeenCalled()
								done()
				eventResize:
					resizeSpy = spyCall (event) ->
						expect(event.start).toEqualMoment('2015-11-23T02:00:00')
						expect(event.end).toEqualMoment('2015-11-23T04:30:00')
						resource = currentCalendar.getEventResource(event)
						expect(resource).toBeFalsy()

	describe 'with resource columns above date columns', ->
		pushOptions
			defaultView: 'agendaThreeDay'
			groupByResource: true

		it 'allows a same-day resize', (done) ->
			initCalendar
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
				]
				eventAfterAllRender: oneCall -> # avoid second call after event rerender
					$('.event1').simulate('mouseover') # resizer only shows on hover
					$('.event1 .fc-resizer')
						.simulate 'drag',
							end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00')
							callback: ->
								expect(resizeSpy).toHaveBeenCalled()
								done()
				eventResize:
					resizeSpy = spyCall (event) ->
						expect(event.start).toEqualMoment('2015-11-29T02:00:00')
						expect(event.end).toEqualMoment('2015-11-29T04:30:00')
						resource = currentCalendar.getEventResource(event)
						expect(resource.id).toBe('b')

		it 'allows a different-day resize', (done) ->
			initCalendar
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
				]
				eventAfterAllRender: oneCall ->
					$('.event1').simulate('mouseover') # resizer only shows on hover
					$('.event1 .fc-resizer')
						.simulate 'drag',
							end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00')
							callback: ->
								expect(resizeSpy).toHaveBeenCalled()
								done()
				eventResize:
					resizeSpy = spyCall (event) ->
						expect(event.start).toEqualMoment('2015-11-29T02:00:00')
						expect(event.end).toEqualMoment('2015-11-30T04:30:00')
						resource = currentCalendar.getEventResource(event)
						expect(resource.id).toBe('b')

		it 'disallows a resize across resources', (done) ->
			initCalendar
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
				]
				eventAfterAllRender: oneCall ->
					$('.event1').simulate('mouseover') # resizer only shows on hover
					$('.event1 .fc-resizer')
						.simulate 'drag',
							end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00')
							callback: ->
								expect(resizeSpy).not.toHaveBeenCalled()
								done()
				eventResize:
					resizeSpy = spyCall()

	describe 'with date columns above resource columns', ->
		pushOptions
			defaultView: 'agendaThreeDay'
			groupByDateAndResource: true

		it 'allows a same-day resize', (done) ->
			initCalendar
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }
				]
				eventAfterAllRender: oneCall ->
					$('.event1').simulate('mouseover') # resizer only shows on hover
					$('.event1 .fc-resizer')
						.simulate 'drag',
							end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00')
							callback: ->
								expect(resizeSpy).toHaveBeenCalled()
								done()
				eventResize:
					resizeSpy = spyCall (event) ->
						expect(event.start).toEqualMoment('2015-11-30T02:00:00')
						expect(event.end).toEqualMoment('2015-11-30T04:30:00')
						resource = currentCalendar.getEventResource(event)
						expect(resource.id).toBe('b')

		it 'allows a multi-day resize', (done) ->
			initCalendar
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
				]
				eventAfterAllRender: oneCall ->
					$('.event1').simulate('mouseover') # resizer only shows on hover
					$('.event1 .fc-resizer')
						.simulate 'drag',
							end: getResourceTimeGridPoint('a', '2015-11-30T04:00:00')
							callback: ->
								expect(resizeSpy).toHaveBeenCalled()
								done()
				eventResize:
					resizeSpy = spyCall (event) ->
						expect(event.start).toEqualMoment('2015-11-29T02:00:00')
						expect(event.end).toEqualMoment('2015-11-30T04:30:00')
						resource = currentCalendar.getEventResource(event)
						expect(resource.id).toBe('a')

		it 'disallows a resize across resources', (done) ->
			initCalendar
				events: [
					{ title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
				]
				eventAfterAllRender: oneCall ->
					$('.event1').simulate('mouseover') # resizer only shows on hover
					$('.event1 .fc-resizer')
						.simulate 'drag',
							end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00')
							callback: ->
								expect(resizeSpy).not.toHaveBeenCalled()
								done()
				eventResize:
					resizeSpy = spyCall()
