
rtlScrollSystem = null


normalizedHScroll = (el, val) -> # TODO: make separate getter/setter
	direction = el.css('direction')
	node = el[0]

	if val? # setter
		if direction is 'rtl'
			switch rtlScrollSystem
				when 'positive'
					val = val - node.clientWidth + node.scrollWidth
				when 'reverse'
					val = -val
		node.scrollLeft = val
		el
	else # getter
		val = node.scrollLeft
		if direction is 'rtl'
			switch rtlScrollSystem
				when 'positive'
					val = val + node.clientWidth - node.scrollWidth
				when 'reverse'
					val = -val
		val


getScrollFromLeft = (el) ->
	direction = el.css('direction')
	node = el[0]
	val = node.scrollLeft

	if direction is 'rtl'
		switch rtlScrollSystem
			when 'negative'
				val = val - node.clientWidth + node.scrollWidth
			when 'reverse'
				val = -val - node.clientWidth + node.scrollWidth

	val


detectRtlScrollSystem = ->
	el = $('
		<div style="
		position: absolute
		top: -1000px;
		width: 1px;
		height: 1px;
		overflow: scroll;
		direction: rtl;
		font-size: 14px;
		">A</div>
		').appendTo('body')
	node = el[0]

	system =
		if (node.scrollLeft > 0)
			'positive'
		else
			node.scrollLeft = 1
			if el.scrollLeft > 0
				'reverse'
			else
				'negative'

	el.remove()
	system


$ ->
	rtlScrollSystem = detectRtlScrollSystem()



###
# Pipes the given promise's resolve/reject/progress events to a Deferred object.
# If a deferred object is not given, a new one is created.
# The deferred object is always returned.
pipeToDeferred = (promise, deferred=$.Deferred()) ->
	$.when(promise)
		.done (res) ->
			deferred.resolve(res)
		.fail ->
			deferred.reject()
		.progress (args) ->
			deferred.notify(args)
	deferred
###





# http://stackoverflow.com/questions/24276619/better-way-to-get-the-viewport-of-a-scrollable-div-in-rtl-mode/24394376#24394376