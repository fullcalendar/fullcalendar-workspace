
# Test-running Utils
# --------------------------------------------------------------------------------------------------

optionsStack = null
currentCalendar = null

beforeEach ->
	optionsStack = []

pushOptions = (options) ->
	beforeEach ->
		optionsStack.push(options)

initCalendar = (options) ->
	affix('#calendar')
	if options
		optionsStack.push(options)
	options = $.extend.apply($, [ {} ].concat(optionsStack))

	# do this instead of the normal constructor,
	# so currentCalendar is available even before render
	Calendar = $.fullCalendar.Calendar
	currentCalendar = new Calendar($('#calendar'), options)
	currentCalendar.render()

afterEach ->
	$('#calendar').fullCalendar('destroy')
	currentCalendar = null

###
describeOptions(optionName, descriptionAndValueHash, callback)
describeOptions(descriptionAndOptionsHash, callback)
###
describeOptions = (optName, hash, callback) ->
	if $.type(optName) == 'object'
		callback = hash
		hash = optName
		optName = null
	$.each hash, (desc, val) ->
		if optName
			opts = {}
			opts[optName] = val
		else
			opts = val
		opts = $.extend(true, {}, opts) # recursive clone
		describe desc, ->
			pushOptions(opts)
			callback(val)

describeValues = (hash, callback) ->
	$.each hash, (desc, val) ->
		describe desc, ->
			callback(val)

# wraps an existing function in a spy, calling through to the function
spyCall = (func) ->
	func = func or ->
	obj = { func: func }
	spyOn(obj, 'func').and.callThrough()
	obj.func


# More FullCalendar-specific Utils
# --------------------------------------------------------------------------------------------------

timezoneScenarios =
	'none':
		description: 'when no timezone'
		value: null
		moment: (str) ->
			$.fullCalendar.moment.parseZone(str)
	'local':
		description: 'when local timezone'
		value: 'local'
		moment: (str) ->
			moment(str)
	'UTC':
		description: 'when UTC timezone'
		moment: (str) ->
			moment.utc(str)

describeTimezones = (callback) ->
	$.each timezoneScenarios, (name, scenario) ->
		describe scenario.description, ->
			pushOptions({ timezone: name })
			callback(scenario)

describeTimezone = (name, callback) ->
	scenario = timezoneScenarios[name]
	describe scenario.description, ->
		pushOptions({ timezone: name })
		callback(scenario)

isElWithinRtl = (el) ->
	el.closest('.fc').hasClass('fc-rtl')


# Lang Utils
# --------------------------------------------------------------------------------------------------

oneCall = (func) ->
	called = false
	->
		if not called
			called = true
			func.apply(this, arguments)
