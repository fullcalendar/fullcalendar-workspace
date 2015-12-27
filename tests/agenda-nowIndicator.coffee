
describe 'resource agenda now-indicator', ->
	pushOptions
		now: '2015-12-26T02:30:00'
		scrollTime: '00:00'
		views:
			agendaThreeDay:
				type: 'agenda'
				duration: { days: 3 }

	it 'renders once for each resource', ->
		initCalendar
			defaultView: 'agendaThreeDay'
			nowIndicator: true
			groupByResource: true
			resources: [
				{ id: 'a', title: 'Resource A' }
				{ id: 'b', title: 'Resource B' }
			]
		expect($('.fc-now-indicator-arrow').length).toBe(1)
		expect($('.fc-now-indicator-line').length).toBe(2)
