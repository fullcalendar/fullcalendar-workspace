
describe 'internal View classes', ->

	it 'are exposed', ->
		FC = $.fullCalendar

		expect(typeof FC.TimelineView).toBe('function')
		expect(typeof FC.ResourceTimelineView).toBe('function')
		expect(typeof FC.ResourceAgendaView).toBe('function')
		expect(typeof FC.ResourceBasicView).toBe('function')
		expect(typeof FC.ResourceMonthView).toBe('function')
