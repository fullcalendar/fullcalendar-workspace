
# Bounding Rect Utils
# --------------------------------------------------------------------------------------------------


getBoundingRect = (el) ->
	el = $(el)
	expect(el.length).toBe(1)
	rect = el.offset()
	rect.right = rect.left + el.outerWidth()
	rect.bottom = rect.top + el.outerHeight()
	rect.node = el[0] # very useful for debugging
	rect


getJointBoundingRect = (els) ->
	els = $(els)
	expect(els.length).toBeGreaterThan(0)
	rects = for el in els
		getBoundingRect(el)
	joinRects.apply(null, rect)


getLeadingBoundingRect = (els, isRTL) ->
	els = $(els)
	expect(els.length).toBeGreaterThan(0)
	best = null
	for node in els
		rect = getBoundingRect(node)
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


# given an element, returns its bounding box. given a rect, returns the rect.
massageRect = (input) ->
	if isRect(input)
		input
	else
		getBoundingRect(input)


isRect = (input) ->
	'left' of input and 'right' of input and 'top' of input and 'bottom' of input


# Geometry Utils
# --------------------------------------------------------------------------------------------------


joinRects = (rect, otherRects...) ->
	for otherRect in otherRects
		rect =
			left: Math.min(rect.left, otherRect.left)
			right: Math.max(rect.right, otherRect.right)
			top: Math.min(rect.top, otherRect.top)
			bottom: Math.max(rect.bottom, otherRect.bottom)
	rect


intersectRects = (rect, otherRects...) ->
	for otherRect in otherRects
		rect =
			left: Math.max(rect.left, otherRect.left)
			right: Math.min(rect.right, otherRect.right)
			top: Math.max(rect.top, otherRect.top)
			bottom: Math.min(rect.bottom, otherRect.bottom)
		if rect.right < rect.left or rect.bottom < rect.top
			return false
	rect


getRectCenter = (rect) ->
	{
		left: (rect.left + rect.right) / 2
		top: (rect.top + rect.bottom) / 2
	}


isRectMostlyAbove = (subjectRect, otherRect) ->
	(subjectRect.bottom - otherRect.top) < # overlap is less than
		(subjectRect.bottom - subjectRect.top) / 2 # half the height


isRectMostlyLeft = (subjectRect, otherRect) ->
	(subjectRect.right - otherRect.left) < # overlap is less then
		(subjectRect.right - subjectRect.left) / 2 # half the width


isRectMostlyBounded = (subjectRect, boundRect) ->
	isRectMostlyHBounded(subjectRect, boundRect) and
		isRectMostlyVBounded(subjectRect, boundRect)


isRectMostlyHBounded = (subjectRect, boundRect) ->
	Math.min(subjectRect.right, boundRect.right) -
		Math.max(subjectRect.left, boundRect.left) > # overlap area is greater than
			(subjectRect.right - subjectRect.left) / 2 # half the width


isRectMostlyVBounded = (subjectRect, boundRect) ->
	Math.min(subjectRect.bottom, boundRect.bottom) -
		Math.max(subjectRect.top, boundRect.top) > # overlap area is greater than
			(subjectRect.bottom - subjectRect.top) / 2 # half the height


# Jasmine Adapters
# --------------------------------------------------------------------------------------------------

beforeEach ->
	jasmine.addMatchers

		toBeMostlyAbove: ->
			compare: (subject, other) ->
				result = { pass: isRectMostlyAbove(massageRect(subject), massageRect(other)) }
				if not result.pass
					result.message = 'first rect is not mostly above the second'
				result

		toBeMostlyBelow: ->
			compare: (subject, other) ->
				result = { pass: not isRectMostlyAbove(massageRect(subject), massageRect(other)) }
				if not result.pass
					result.message = 'first rect is not mostly below the second'
				result

		toBeMostlyLeftOf: ->
			compare: (subject, other) ->
				result = { pass: isRectMostlyLeft(massageRect(subject), massageRect(other)) }
				if not result.pass
					result.message = 'first rect is not mostly left of the second'
				result

		toBeMostlyRightOf: ->
			compare: (subject, other) ->
				result = { pass: not isRectMostlyLeft(massageRect(subject), massageRect(other)) }
				if not result.pass
					result.message = 'first rect is not mostly right of the second'
				result

		toBeMostlyBoundedBy: ->
			compare: (subject, other) ->
				result = { pass: isRectMostlyBounded(massageRect(subject), massageRect(other)) }
				if not result.pass
					result.message = 'first rect is not mostly bounded by the second'
				result

		toBeMostlyHBoundedBy: ->
			compare: (subject, other) ->
				result = { pass: isRectMostlyHBounded(massageRect(subject), massageRect(other)) }
				if not result.pass
					result.message = 'first rect does not mostly horizontally bound the second'
				result

		toBeMostlyVBoundedBy: ->
			compare: (subject, other) ->
				result = { pass: isRectMostlyVBounded(massageRect(subject), massageRect(other)) }
				if not result.pass
					result.message = 'first rect does not mostly vertically bound the second'
				result

		toBeLeftOf: ->
			compare: (subject, other) ->
				result = { pass: massageRect(subject).right < massageRect(other).left }
				if not result.pass
					result.message = 'first rect is not left of the second'
				result

		toBeRightOf: ->
			compare: (subject, other) ->
				result = { pass: massageRect(subject).left > massageRect(other).right }
				if not result.pass
					result.message = 'first rect is not right of the second'
				result
