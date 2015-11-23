
# TODO: consolidate repeat code and clean up


getBoundingRect = (el) ->
	el = $(el)
	expect(el.length).toBe(1)
	rect = el.offset()
	rect.right = rect.left + el.outerWidth()
	rect.bottom = rect.top + el.outerHeight()
	rect.node = el[0] # very useful for debuggin
	rect


getJointBoundingRect = (els) ->
	els = $(els)
	expect(els.length).toBeGreaterThan(0)
	rects = for el in els
		getBoundingRect(el)
	joinRects.apply(null, rect)


getLeadingBoundingRect = (els, isRTL) -> # TODO: accept rects too???
	els = $(els)
	expect(els.length).toBeGreaterThan(0)
	best = null
	for node in els
		rect = getBoundingRect(node)
		rect.node = node
		if not best
			best = rect
		else if isRTL
			if rect.right > best.right
				best = rect
		else
			if rect.left < best.left
				best = rect
	best


getTrailingBoundingRect = (els, isRTL) ->
	els = $(els)
	expect(els.length).toBeGreaterThan(0)
	best = null
	for node in els
		rect = getBoundingRect(node)
		rect.node = node # redundant!!!
		if not best
			best = rect
		else if isRTL
			if rect.left < best.left
				best = rect
		else
			if rect.right > best.right
				best = rect
	best


sortBoundingRects = (els, isRTL) ->
	rects = for node in els
		getBoundingRect(node)
	rects.sort (a, b) ->
		if isRTL
			b.right - a.right
		else
			a.left - b.left
	rects



joinRects = (rect, otherRects...) ->
	for otherRect in otherRects
		rect =
			left: Math.min(rect.left, otherRect.left)
			right: Math.max(rect.right, otherRect.right)
			top: Math.min(rect.top, otherRect.top)
			bottom: Math.max(rect.bottom, otherRect.bottom)
	rect


beforeEach -> # TODO: need this?
	jasmine.addMatchers

		# TODO: accept els too? YES

		toBeMostlyAbove: ->
			compare: (subjectRect, otherRect) ->
				result =
					pass: subjectRect.bottom < otherRect.top or # completely above
						(subjectRect.bottom - otherRect.top) < # overlap is less than
							(subjectRect.bottom - subjectRect.top) / 2 # half the height
				if not result.pass
					result.message = 'first rect is not mostly above the second'
				result

		toBeMostlyLeftOf: ->
			compare: (subjectRect, otherRect) ->
				result =
					pass: subjectRect.right < otherRect.left or # completely left of
						(subjectRect.right - otherRect.left) < # overlap is less then
							(subjectRect.right - subjectRect.left) / 2 # half the width
				if not result.pass
					result.message = 'first rect is not mostly left of the second'
				result

		toBeMostlyRightOf: ->
			compare: (subjectRect, otherRect) ->
				result =
					pass: subjectRect.left > otherRect.right or # completely right of
						(otherRect.right - subjectRect.left) < # overlap is less than
							(subjectRect.right - subjectRect.left) / 2 # half the width
				if not result.pass
					result.message = 'first rect is not mostly right of the second'
				result

		toBeMostlyHorizontallyWithin: ->
			compare: (subjectRect, otherRect) ->
				result =
					pass: Math.min(subjectRect.right, otherRect.right) -
						Math.max(subjectRect.left, otherRect.left) > # overlap area is greater than
							(subjectRect.right - subjectRect.left) / 2 # half the width
				if not result.pass
					result.message = 'first rect is not mostly horizontally within the second'
				result



		toBeMostlyBoundedBy: -> # naming :(
			compare: (subjectRect, otherRect) ->
				result =
					pass: \
						Math.min(subjectRect.right, otherRect.right) -
							Math.max(subjectRect.left, otherRect.left) > # overlap area is greater than
							(subjectRect.right - subjectRect.left) / 2 and # half the width
						Math.min(subjectRect.bottom, otherRect.bottom) -
							Math.max(subjectRect.top, otherRect.top) >
							(subjectRect.bottom - subjectRect.top) / 2
				if not result.pass
					result.message = 'first rect is not mostly bounded by the second'
				result



		toBeLeftOf: ->
			compare: (subjectRect, otherRect) ->
				result =
					pass: subjectRect.right < otherRect.left
				if not result.pass
					result.message = 'first rect is not left of the second'
				result

		toBeRightOf: ->
			compare: (subjectRect, otherRect) ->
				result =
					pass: subjectRect.left > otherRect.right
				if not result.pass
					result.message = 'first rect is not right of the second'
				result
