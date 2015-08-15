
optionsStack = null
currentCalendar = null

beforeEach ->
	optionsStack = []

stackCalendarOptions = (options) ->
	beforeEach ->
		optionsStack.push(options)

initCalendar = (options) ->
	affix('#calendar')
	if options
		optionsStack.push(options)
	options = $.extend.apply($, [ {} ].concat(optionsStack))

	# do this instead of the normal constructor, so currentCalendar is available always
	Calendar = $.fullCalendar.Calendar
	currentCalendar = new Calendar($('#calendar'), options)
	currentCalendar.render()

	###
	$('#calendar').fullCalendar(options)
	currentCalendar = $('#calendar').fullCalendar('getCalendar') # return
	###

afterEach ->
	$('#calendar').fullCalendar('destroy')
	currentCalendar = null