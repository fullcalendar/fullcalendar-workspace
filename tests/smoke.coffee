
describe 'timeline', ->

	it 'can switch views', (done) ->
		switchCnt = 0
		initCalendar
			now: '2016-01-07'
			editable: true
			aspectRatio: 1.8
			scrollTime: '00:00'
			header: 
				left: 'today prev,next'
				center: 'title'
				right: 'timelineDay,timelineThreeDays,agendaDay,agendaTwoDay,agendaWeek,month'
			defaultView: 'timelineDay'
			views:
				timelineThreeDays:
					type: 'timeline'
					duration: { days: 3 }
				agendaTwoDay:
					type: 'agenda'
					duration: { days: 2 }
					groupByResource: true
			resourceLabelText: 'Rooms'
			resources: [
				{ id: 'a', title: 'Auditorium A' }
				{ id: 'b', title: 'Auditorium B', eventColor: 'green' }
				{ id: 'c', title: 'Auditorium C', eventColor: 'orange' }
			]
			events: [
				{ id: '1', resourceId: 'a', start: '2016-01-07T02:00:00', end: '2016-01-07T07:00:00', title: 'event 1' }
				{ id: '2', resourceId: 'b', start: '2016-01-07T05:00:00', end: '2016-01-07T22:00:00', title: 'event 2' }
				{ id: '3', resourceId: 'c', start: '2016-01-06', end: '2016-01-08', title: 'event 3' }
				{ id: '4', resourceId: 'a', start: '2016-01-07T03:00:00', end: '2016-01-07T08:00:00', title: 'event 4' }
				{ id: '5', resourceId: 'b', start: '2016-01-07T00:30:00', end: '2016-01-07T02:30:00', title: 'event 5' }
			]
			eventAfterAllRender: (view) ->
				switchCnt++
				switch switchCnt
					when 1
						expect(view.type).toBe('timelineDay')
						currentCalendar.changeView('timelineThreeDays')
					when 2
						expect(view.type).toBe('timelineThreeDays')
						currentCalendar.changeView('agendaDay')
					when 3
						expect(view.type).toBe('agendaDay')
						currentCalendar.changeView('agendaTwoDay')
					when 4
						expect(view.type).toBe('agendaTwoDay')
						currentCalendar.changeView('agendaWeek')
					when 5
						expect(view.type).toBe('agendaWeek')
						currentCalendar.changeView('month')
					when 6
						expect(view.type).toBe('month')
						currentCalendar.changeView('timelineDay')
					when 7
						expect(view.type).toBe('timelineDay')
						done()
