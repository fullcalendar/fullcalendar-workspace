
class TimelineGridEventRenderer extends EventRenderer

	###
	component must be { segContainerEl, segContainerHeight, rangeToCoords }
	###


	computeDisplayEventTime: ->
		not @view.isTimeScale # because times should be obvious via axis


	computeDisplayEventEnd: ->
		false


	# Computes a default event time formatting string if `timeFormat` is not explicitly defined
	computeEventTimeFormat: ->
		@view.opt('extraSmallTimeFormat')


	renderFgSegs: (segs) ->

		for seg in segs
			# TODO: centralize logic (also in updateSegPositions)
			coords = @component.rangeToCoords(seg)
			seg.el.css
				left: (seg.left = coords.left)
				right: -(seg.right = coords.right)

		# attach segs
		for seg in segs
			seg.el.appendTo(@component.segContainerEl)

		# compute seg verticals
		for seg in segs
			seg.height = seg.el.outerHeight(true) # include margin

		@buildSegLevels(segs)
		@component.segContainerHeight = computeOffsetForSegs(segs) # returns this value!

		# assign seg verticals
		for seg in segs
			seg.el.css('top', seg.top)

		@component.segContainerEl.height(@component.segContainerHeight)


	# NOTE: this modifies the order of segs
	buildSegLevels: (segs) ->
		segLevels = []

		@sortEventSegs(segs)

		for unplacedSeg in segs
			unplacedSeg.above = []

			# determine the first level with no collisions
			level = 0 # level index
			while level < segLevels.length
				isLevelCollision = false

				# determine collisions
				for placedSeg in segLevels[level]
					if timeRowSegsCollide(unplacedSeg, placedSeg)
						unplacedSeg.above.push(placedSeg)
						isLevelCollision = true

				if isLevelCollision
					level += 1
				else
					break

			# insert into the first non-colliding level. create if necessary
			(segLevels[level] or (segLevels[level] = []))
				.push(unplacedSeg)

			# record possible colliding segments below (TODO: automated test for this)
			level += 1
			while level < segLevels.length
				for belowSeg in segLevels[level]
					if timeRowSegsCollide(unplacedSeg, belowSeg)
						belowSeg.above.push(unplacedSeg)
				level += 1

		segLevels


	unrenderFgSegs: ->
		@component.segContainerEl.empty()
		@component.segContainerEl.height('')
		@component.segContainerHeight = null


	fgSegHtml: (seg, disableResizing) ->
		eventDef = seg.footprint.eventDef
		isDraggable = @view.isEventDefDraggable(eventDef)
		isResizableFromStart = seg.isStart and @view.isEventDefResizableFromStart(eventDef)
		isResizableFromEnd = seg.isEnd and @view.isEventDefResizableFromEnd(eventDef)

		classes = @getSegClasses(seg, isDraggable, isResizableFromStart or isResizableFromEnd)
		classes.unshift('fc-timeline-event', 'fc-h-event')

		timeText = @getTimeText(seg.footprint)

		'<a class="' + classes.join(' ') + '" style="' + cssToStr(@getSkinCss(seg.footprint.eventDef)) + '"' +
			(if eventDef.url
				' href="' + htmlEscape(eventDef.url) + '"'
			else
				'') +
			'>' +
			'<div class="fc-content">' +
				(if timeText
					'<span class="fc-time">' +
						htmlEscape(timeText) +
					'</span>'
				else
					'') +
				'<span class="fc-title">' +
					(if eventDef.title then htmlEscape(eventDef.title) else '&nbsp;') +
				'</span>' +
			'</div>' +
			'<div class="fc-bg" />' +
			(if isResizableFromStart
				'<div class="fc-resizer fc-start-resizer"></div>'
			else
				'') +
			(if isResizableFromEnd
				'<div class="fc-resizer fc-end-resizer"></div>'
			else
				'') +
		'</a>'


# Seg Rendering Utils
# ----------------------------------------------------------------------------------------------------------------------


computeOffsetForSegs = (segs) ->
	max = 0
	for seg in segs
		max = Math.max(max, computeOffsetForSeg(seg))
	max


computeOffsetForSeg = (seg) ->
	if not seg.top?
		seg.top = computeOffsetForSegs(seg.above)
	seg.top + seg.height


timeRowSegsCollide = (seg0, seg1) ->
	seg0.left < seg1.right and seg0.right > seg1.left
