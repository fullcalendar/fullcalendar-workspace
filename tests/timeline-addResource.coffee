
describe 'timeline addResource', ->

	pushOptions
		defaultDate: '2016-05-31'

	# https://github.com/fullcalendar/fullcalendar-scheduler/issues/179
	it 'works when switching views', ->
		initCalendar
			defaultView: 'timelineDay',
			resources: [
				{ id: 'a', title: 'Auditorium A' }
				{ id: 'b', title: 'Auditorium B' }
				{ id: 'c', title: 'Auditorium C' }
			]
		expect(getTimelineResourceIds()).toEqual([ 'a', 'b', 'c' ])

		currentCalendar.changeView('timelineWeek')
		expect(getTimelineResourceIds()).toEqual([ 'a', 'b', 'c' ])

		currentCalendar.addResource({ id: 'd', title: 'Auditorium D' }, true)
		expect(getTimelineResourceIds()).toEqual([ 'a', 'b', 'c', 'd' ])

		currentCalendar.changeView('timelineDay')
		expect(getTimelineResourceIds()).toEqual([ 'a', 'b', 'c', 'd' ])
