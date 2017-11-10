
describe 'timeline rendering', ->
	pushOptions
		defaultDate: '2017-10-27'

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


	it 'renders time slots localized', ->
		initCalendar
			defaultView: 'timelineWeek'
			slotDuration: '01:00'
			scrollTime: 0
			locale: 'lv'

		expect(
			$('.fc-head .fc-time-area th:first .fc-cell-text').text()
		).toBe('P 23.10.2017.')
