
class TimelineGridHelperRenderer extends HelperRenderer


	renderSegs: (segs, sourceSeg) ->
		@renderSegsInContainers([[ @component, segs ]], sourceSeg)


	renderSegsInContainers: (pairs, sourceSeg) ->
		helperNodes = [] # .fc-event-container

		for [ containerObj, segs ] in pairs
			for seg in segs

				# TODO: centralize logic (also in renderFgSegsInContainers)
				coords = @component.rangeToCoords(seg)
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

				# FYI: containerObj is either the Grid or a ResourceRow
				# TODO: detangle the concept of resources
				if sourceSeg and sourceSeg.resourceId == containerObj.resource?.id
					seg.el.css('top', sourceSeg.el.css('top'))
				else
					seg.el.css('top', 0)

		for [ containerObj, segs ] in pairs

			helperContainerEl = $('<div class="fc-event-container fc-helper-container"/>')
				.appendTo(containerObj.innerEl)

			helperNodes.push(helperContainerEl[0])

			for seg in segs
				helperContainerEl.append(seg.el)

		$(helperNodes) # return value. TODO: need to accumulate across calls?
