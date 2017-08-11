
class TimelineGridHelperRenderer extends HelperRenderer

	container: null # a TimelineGrid or { innerEl, ?resource }
	#component: null # a TimelineGrid


	constructor: (timelineGrid, fillRenderer, container) ->
		super

		@container = container or timelineGrid


	renderSegs: (segs, sourceSeg) ->
		helperNodes = [] # .fc-event-container

		for seg in segs

			# TODO: centralize logic (also in renderFgSegsInContainers)
			coords = @component.rangeToCoords(seg)
			seg.el.css
				left: (seg.left = coords.left)
				right: -(seg.right = coords.right)

			# TODO: detangle the concept of resources
			if sourceSeg and sourceSeg.resourceId == @container.resource?.id
				seg.el.css('top', sourceSeg.el.css('top'))
			else
				seg.el.css('top', 0)

		helperContainerEl = $('<div class="fc-event-container fc-helper-container"/>')
			.appendTo(@container.innerEl)

		helperNodes.push(helperContainerEl[0])

		for seg in segs
			helperContainerEl.append(seg.el)

		$(helperNodes) # return value. TODO: need to accumulate across calls?
