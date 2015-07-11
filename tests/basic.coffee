
beforeEach ->
	affix('#calendar')

afterEach ->
	$('#calendar').fullCalendar('destroy')

describe 'basic shit', ->
	it 'should work', ->

		$('#calendar').fullCalendar
			resources: true
			defaultView: 'timelineDay'

		debugger

		expect(5).toBe(5)