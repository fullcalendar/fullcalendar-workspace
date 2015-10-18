
MIN_AUTO_LABELS = 18 # more than `12` months but less that `24` hours
MAX_AUTO_SLOTS_PER_LABEL = 6 # allows 6 10-min slots in an hour
MAX_AUTO_CELLS = 200 # allows 4-days to have a :30 slot duration
MAX_CELLS = 1000 # TODO: expose this for the poweruser

DEFAULT_GRID_DURATION = { months: 1 }

# potential nice values for slot-duration and interval-duration
STOCK_SUB_DURATIONS = [ # from largest to smallest
	{ years: 1 }
	{ months: 1 }
	{ days: 1 }
	{ hours: 1 }
	{ minutes: 30 }
	{ minutes: 15 }
	{ minutes: 10 }
	{ minutes: 5 }
	{ minutes: 1 }
	{ seconds: 30 }
	{ seconds: 15 }
	{ seconds: 10 }
	{ seconds: 5 }
	{ seconds: 1 }
	{ milliseconds: 500 }
	{ milliseconds: 100 }
	{ milliseconds: 10 }
	{ milliseconds: 1 }
]


TimelineGrid::initScaleProps = ->

	@labelInterval = @queryDurationOption('slotLabelInterval')
	@slotDuration = @queryDurationOption('slotDuration')

	@ensureGridDuration()
	@validateLabelAndSlot() # validate after computed grid duration
	@ensureLabelInterval()
	@ensureSlotDuration()

	input = @opt('slotLabelFormat')
	type = $.type(input)
	@headerFormats =
		if type == 'array'
			input
		else if type == 'string'
			[ input ]
		else
			@computeHeaderFormats()

	@isTimeScale = durationHasTime(@slotDuration)
	@largeUnit =
		if not @isTimeScale
			slotUnit = computeIntervalUnit(@slotDuration)
			if /year|month|week/.test(slotUnit)
				slotUnit

	@emphasizeWeeks = @slotDuration.as('days') == 1 and
		@duration.as('weeks') >= 2 and
		not @opt('businessHours')

	###
	console.log('view duration =', @duration.humanize())
	console.log('label interval =', @labelInterval.humanize())
	console.log('slot duration =', @slotDuration.humanize())
	console.log('header formats =', @headerFormats)
	console.log('isTimeScale', @isTimeScale)
	console.log('largeUnit', @largeUnit)
	###


TimelineGrid::queryDurationOption = (name) ->
	input = @opt(name)
	if input?
		dur = moment.duration(input)
		if +dur
			dur


TimelineGrid::validateLabelAndSlot = -> # needs a defined @duration (grid's duration)

	# make sure labelInterval doesn't exceed the max number of cells
	if @labelInterval
		labelCnt = divideDurationByDuration(@duration, @labelInterval)
		if labelCnt > MAX_CELLS
			FC.warn('slotLabelInterval results in too many cells')
			@labelInterval = null

	# make sure slotDuration doesn't exceed the maximum number of cells
	if @slotDuration
		slotCnt = divideDurationByDuration(@duration, @slotDuration)
		if slotCnt > MAX_CELLS
			FC.warn('slotDuration results in too many cells')
			@slotDuration = null

	# make sure labelInterval is a multiple of slotDuration
	if @labelInterval and @slotDuration
		slotsPerLabel = divideDurationByDuration(@labelInterval, @slotDuration)
		if not isInt(slotsPerLabel) or slotsPerLabel < 1
			FC.warn('slotLabelInterval must be a multiple of slotDuration')
			@slotDuration = null


TimelineGrid::ensureGridDuration = ->
	gridDuration = @duration

	if not gridDuration
		gridDuration = @view.intervalDuration

		if not gridDuration

			# no values to compute from. resort to default
			if not @labelInterval and not @slotDuration
				gridDuration = moment.duration(DEFAULT_GRID_DURATION)

			# compute based off label interval
			# find the smallest view duration that yields the minimum number of labels
			else
				labelInterval = @ensureLabelInterval()

				for input in STOCK_SUB_DURATIONS by -1 # smallest to largest
					gridDuration = moment.duration(input)
					labelCnt = divideDurationByDuration(gridDuration, labelInterval)
					if labelCnt >= MIN_AUTO_LABELS
						break

		@duration = gridDuration

	gridDuration


TimelineGrid::ensureLabelInterval = ->
	labelInterval = @labelInterval

	if not labelInterval

		# no values to compute from. resort to the default view duration
		if not @duration and not @slotDuration
			@ensureGridDuration() # will compute @duration

		# compute based off the slot duration
		# find the largest label interval with an acceptable slots-per-label
		if @slotDuration
			for input in STOCK_SUB_DURATIONS
				tryLabelInterval = moment.duration(input)
				slotsPerLabel = divideDurationByDuration(tryLabelInterval, @slotDuration)
				if isInt(slotsPerLabel) and slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL
					labelInterval = tryLabelInterval
					break

			# use the slot duration as a last resort
			if not labelInterval
				labelInterval = @slotDuration

		# compute based off the view's duration
		# find the largest label interval that yields the minimum number of labels
		else
			for input in STOCK_SUB_DURATIONS
				labelInterval = moment.duration(input)
				labelCnt = divideDurationByDuration(@duration, labelInterval)
				if labelCnt >= MIN_AUTO_LABELS
					break

		@labelInterval = labelInterval

	labelInterval


TimelineGrid::ensureSlotDuration = ->
	slotDuration = @slotDuration

	if not slotDuration
		labelInterval = @ensureLabelInterval() # will compute if necessary

		# compute based off the label interval
		# find the largest slot duration that is different from labelInterval, but still acceptable
		for input in STOCK_SUB_DURATIONS
			trySlotDuration = moment.duration(input)
			slotsPerLabel = divideDurationByDuration(labelInterval, trySlotDuration)
			if isInt(slotsPerLabel) and slotsPerLabel > 1 and slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL
				slotDuration = trySlotDuration
				break

		# only allow the value if it won't exceed the view's # of slots limit
		if slotDuration and @duration
			slotCnt = divideDurationByDuration(@duration, slotDuration)
			if slotCnt > MAX_AUTO_CELLS
				slotDuration = null

		# use the label interval as a last resort
		if not slotDuration
			slotDuration = labelInterval

		@slotDuration = slotDuration

	slotDuration


TimelineGrid::computeHeaderFormats = ->
	view = @view
	gridDuration = @duration
	labelInterval = @labelInterval
	unit = computeIntervalUnit(labelInterval)
	weekNumbersVisible = @opt('weekNumbers')
	format0 = format1 = format2 = null

	# NOTE: weekNumber computation function wont work

	if unit == 'week' and not weekNumbersVisible
		unit = 'day'

	switch unit
		when 'year'
			format0 = 'YYYY' # '2015'

		when 'month'
			if gridDuration.asYears() > 1
				format0 = 'YYYY' # '2015'

			format1 = 'MMM' # 'Jan'

		when 'week'
			if gridDuration.asYears() > 1
				format0 = 'YYYY' # '2015'

			format1 = @opt('shortWeekFormat') # 'Wk4'

		when 'day'
			if gridDuration.asYears() > 1
				format0 = @opt('monthYearFormat') # 'January 2014'
			else if gridDuration.asMonths() > 1
				format0 = 'MMMM' # 'January'

			if weekNumbersVisible
				format1 = @opt('weekFormat') # 'Wk 4'

			# TODO: would use smallDayDateFormat but the way timeline does RTL,
			# we don't want the text to be flipped
			format2 = 'dd D' # @opt('smallDayDateFormat') # 'Su 9'

		when 'hour'
			if weekNumbersVisible
				format0 = @opt('weekFormat') # 'Wk 4'

			if gridDuration.asDays() > 1
				format1 = @opt('dayOfMonthFormat') # 'Fri 9/15'

			format2 = @opt('smallTimeFormat') # '6pm'

		when 'minute'
			# sufficiently large number of different minute cells?
			if labelInterval.asMinutes() / 60 >= MAX_AUTO_SLOTS_PER_LABEL
				format0 = @opt('hourFormat') # '6pm'
				format1 = '[:]mm' # ':30'
			else
				format0 = @opt('mediumTimeFormat') # '6:30pm'

		when 'second'
			# sufficiently large number of different second cells?
			if labelInterval.asSeconds() / 60 >= MAX_AUTO_SLOTS_PER_LABEL
				format0 = 'LT' # '8:30 PM'
				format1 = '[:]ss' # ':30'
			else
				format0 = 'LTS' # '8:30:45 PM'

		when 'millisecond'
			format0 = 'LTS' # '8:30:45 PM'
			format1 = '[.]SSS' # '750'

	[].concat(format0 or [], format1 or [], format2 or [])
