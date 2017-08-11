
class TimelineGridFillRenderer extends FillRenderer

	container: null # a TimelineGrid or { bgSegContainerEl }
	component: null # a TimelineGrid


	constructor: (timelineGrid, container) ->
		super

		@container = container or timelineGrid
		@component = timelineGrid


	attachSegEls: (type, segs) ->
		if segs.length

			if type == 'businessHours'
				className = 'bgevent'
			else
				className = type.toLowerCase()

			# making a new container each time is OKAY
			# all types of segs (background or business hours or whatever) are rendered in one pass
			containerEl = $('<div class="fc-' + className + '-container" />')
				.appendTo(@container.bgSegContainerEl)

			for seg in segs
				coords = @component.rangeToCoords(seg) # TODO: make DRY
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

				seg.el.appendTo(containerEl)

			containerEl # return value
