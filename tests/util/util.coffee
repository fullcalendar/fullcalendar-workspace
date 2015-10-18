
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
