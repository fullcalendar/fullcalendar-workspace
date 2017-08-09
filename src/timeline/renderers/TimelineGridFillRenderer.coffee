
class TimelineGridFillRenderer extends FillRenderer

	component: null # a TimelineView or at least { bgSegContainerEl }
	view: null # a TimelineView


	constructor: (@component) ->
		super

		@view = @component._getView()


	attachSegEls: (type, segs) ->
		if segs.length

			if type == 'businessHours'
				className = 'bgevent'
			else
				className = type.toLowerCase()

			# making a new container each time is OKAY
			# all types of segs (background or business hours or whatever) are rendered in one pass
			containerEl = $('<div class="fc-' + className + '-container" />')
				.appendTo(@component.bgSegContainerEl)

			for seg in segs
				coords = @view.rangeToCoords(seg) # TODO: make DRY
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

				seg.el.appendTo(containerEl)

			containerEl # return value
