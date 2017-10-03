
describe 'timeline rendering', ->

	buildResources = (n) ->
		for i in [0 ... n]
			{ title: 'resource' + i }

	getSpreadsheetScrollEl = ->
		$('.fc-body .fc-resource-area .fc-scroller')[0]

	getTimeScrollEl = ->
		$('.fc-body .fc-time-area .fc-scroller')[0]

	it 'has correct vertical scroll and gutters', ->
		initCalendar
			defaultView: 'timeline'
			resources: buildResources(50)
		
		spreadsheetEl = getSpreadsheetScrollEl()
		timeEl = getTimeScrollEl()

		expect(spreadsheetEl.scrollHeight).toBeGreaterThan(0)
		expect(timeEl.scrollHeight).toBeGreaterThan(0)

		gutter = timeEl.clientHeight - spreadsheetEl.clientHeight
		expect(spreadsheetEl.scrollHeight + gutter)
			.toEqual(timeEl.scrollHeight)
