
class TimelineGridHelperRenderer extends HelperRenderer

	###
	component must be { innerEl, rangeToCoords, ?resource }
	###


	renderSegs: (segs, sourceSeg) ->
		helperNodes = [] # .fc-event-container

		for seg in segs

			# TODO: centralize logic (also in renderFgSegsInContainers)
			coords = @component.rangeToCoords(seg)
			seg.el.css
				left: (seg.left = coords.left)
				right: -(seg.right = coords.right)

			# TODO: detangle the concept of resources
			# TODO: how to identify these two segs as the same!?
			if sourceSeg and sourceSeg.resourceId == @component.resource?.id
				seg.el.css('top', sourceSeg.el.css('top'))
			else
				seg.el.css('top', 0)

		helperContainerEl = $('<div class="fc-event-container fc-helper-container"/>')
			.appendTo(@component.innerEl)

		helperNodes.push(helperContainerEl[0])

		for seg in segs
			helperContainerEl.append(seg.el)

		$(helperNodes) # return value. TODO: need to accumulate across calls?
