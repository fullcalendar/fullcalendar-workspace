
class ResourceTimelineView extends TimelineView

	@mixin(ResourceViewMixin)

	# configuration for View monkeypatch
	canHandleSpecificResources: true

	# configuration for DateComponent monkeypatch
	isResourceFootprintsEnabled: true

	# renders non-resource bg events only
	eventRendererClass: ResourceTimelineEventRenderer

	# time area
	timeBodyTbodyEl: null

	# spreadsheet area
	spreadsheet: null

	# divider
	dividerEls: null
	dividerWidth: null

	# resource rendering options
	superHeaderText: null
	isVGrouping: null
	isHGrouping: null
	groupSpecs: null
	colSpecs: null
	orderSpecs: null

	# resource rows
	tbodyHash: null # used by RowParent
	rowHierarchy: null
	resourceRowHash: null
	nestingCnt: 0
	isNesting: null
	eventRows: null
	shownEventRows: null
	resourceScrollJoiner: null

	# positioning
	rowCoordCache: null


	constructor: ->
		super
		@processResourceOptions()
		@spreadsheet = new Spreadsheet(this)
		@rowHierarchy = new RowParent(this)
		@resourceRowHash = {}


	# Resource Options
	# ------------------------------------------------------------------------------------------------------------------


	processResourceOptions: ->
		allColSpecs = @opt('resourceColumns') or []
		labelText = @opt('resourceLabelText') # TODO: view.override
		defaultLabelText = 'Resources' # TODO: view.defaults
		superHeaderText = null

		if not allColSpecs.length
			allColSpecs.push
				labelText: labelText or defaultLabelText
				text: @getResourceTextFunc()
		else
			superHeaderText = labelText

		plainColSpecs = []
		groupColSpecs = []
		groupSpecs = []
		isVGrouping = false
		isHGrouping = false

		for colSpec in allColSpecs
			if colSpec.group
				groupColSpecs.push(colSpec)
			else
				plainColSpecs.push(colSpec)

		plainColSpecs[0].isMain = true

		if groupColSpecs.length
			groupSpecs = groupColSpecs
			isVGrouping = true
		else
			hGroupField = @opt('resourceGroupField')
			if hGroupField
				isHGrouping = true
				groupSpecs.push
					field: hGroupField
					text: @opt('resourceGroupText')
					render: @opt('resourceGroupRender')

		allOrderSpecs = parseFieldSpecs(@opt('resourceOrder'))
		plainOrderSpecs = []

		for orderSpec in allOrderSpecs
			isGroup = false
			for groupSpec in groupSpecs
				if groupSpec.field == orderSpec.field
					groupSpec.order = orderSpec.order # -1, 0, 1
					isGroup = true
					break
			if not isGroup
				plainOrderSpecs.push(orderSpec)

		@superHeaderText = superHeaderText
		@isVGrouping = isVGrouping
		@isHGrouping = isHGrouping
		@groupSpecs = groupSpecs
		@colSpecs = groupColSpecs.concat(plainColSpecs)
		@orderSpecs = plainOrderSpecs


	# Skeleton Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderSkeleton: ->
		super

		@spreadsheet.el = @el.find('tbody .fc-resource-area')
		@spreadsheet.headEl = @el.find('thead .fc-resource-area')
		@spreadsheet.renderSkeleton()
		# ^ is not a Grid/DateComponent

		# only non-resource grid needs this, so kill it
		# TODO: look into better solution
		@segContainerEl.remove()
		@segContainerEl = null

		timeBodyContainerEl = $('<div class="fc-rows"><table><tbody/></table></div>').appendTo(@timeBodyScroller.canvas.contentEl)
		@timeBodyTbodyEl = timeBodyContainerEl.find('tbody')

		@tbodyHash = { # needed for rows to render
			spreadsheet: @spreadsheet.tbodyEl
			event: @timeBodyTbodyEl
		}

		@resourceScrollJoiner = new ScrollJoiner('vertical', [
			@spreadsheet.bodyScroller
			@timeBodyScroller
		])

		@initDividerMoving()


	renderSkeletonHtml: ->
		'<table>
			<thead class="fc-head">
				<tr>
					<td class="fc-resource-area ' + @widgetHeaderClass + '"></td>
					<td class="fc-divider fc-col-resizer ' + @widgetHeaderClass + '"></td>
					<td class="fc-time-area ' + @widgetHeaderClass + '"></td>
				</tr>
			</thead>
			<tbody class="fc-body">
				<tr>
					<td class="fc-resource-area ' + @widgetContentClass + '"></td>
					<td class="fc-divider fc-col-resizer ' + @widgetHeaderClass + '"></td>
					<td class="fc-time-area ' + @widgetContentClass + '"></td>
				</tr>
			</tbody>
		</table>'


	# Divider Moving
	# ------------------------------------------------------------------------------------------------------------------


	initDividerMoving: ->
		@dividerEls = @el.find('.fc-divider')

		@dividerWidth = @opt('resourceAreaWidth') ? @spreadsheet.tableWidth # tableWidth available after spreadsheet.renderSkeleton
		if @dividerWidth?
			@positionDivider(@dividerWidth)

		@dividerEls.on 'mousedown', (ev) =>
			@dividerMousedown(ev)


	dividerMousedown: (ev) ->
		isRTL = @opt('isRTL')
		minWidth = 30
		maxWidth = @el.width() - 30
		origWidth = @getNaturalDividerWidth()

		dragListener = new DragListener

			dragStart: =>
				@dividerEls.addClass('fc-active')

			drag: (dx, dy) =>
				if isRTL
					width = origWidth - dx
				else
					width = origWidth + dx

				width = Math.max(width, minWidth)
				width = Math.min(width, maxWidth)

				@dividerWidth = width
				@positionDivider(width)
				@calendar.updateViewSize() # if in render queue, will wait until end

			dragEnd: =>
				@dividerEls.removeClass('fc-active')

		dragListener.startInteraction(ev)


	getNaturalDividerWidth: ->
		@el.find('.fc-resource-area').width() # TODO: don't we have this cached?


	positionDivider: (w) ->
		@el.find('.fc-resource-area').width(w) # TODO: don't we have this cached?


	# Sizing
	# ------------------------------------------------------------------------------------------------------------------


	updateSize: (totalHeight, isAuto, isResize) ->
		@spreadsheet.updateSize()
		@resourceScrollJoiner.update()

		# TODO: smarter about not doing this every time, if a single resource is added/removed
		@syncRowHeights()

		headHeight = @syncHeadHeights()

		if isAuto
			bodyHeight = 'auto'
		else
			bodyHeight = totalHeight - headHeight - @queryMiscHeight()

		@timeBodyScroller.setHeight(bodyHeight)
		@spreadsheet.bodyScroller.setHeight(bodyHeight)

		# do children AFTER because of ScrollFollowerSprite abs position issues
		super


	queryMiscHeight: ->
		@el.outerHeight() -
			Math.max(@spreadsheet.headScroller.el.outerHeight(), @timeHeadScroller.el.outerHeight()) -
			Math.max(@spreadsheet.bodyScroller.el.outerHeight(), @timeBodyScroller.el.outerHeight())


	syncHeadHeights: ->
		@spreadsheet.headHeight('auto')
		@headHeight('auto')

		headHeight = Math.max(@spreadsheet.headHeight(), @headHeight())

		@spreadsheet.headHeight(headHeight)
		@headHeight(headHeight)

		headHeight


	# Scrolling
	# ------------------------------------------------------------------------------------------------------------------
	# this is useful for scrolling prev/next dates while resource is scrolled down


	queryResourceScroll: ->
		scroll = {}

		scrollerTop = @timeBodyScroller.scrollEl.offset().top # TODO: use getClientRect

		for rowObj in @getVisibleRows()
			if rowObj.resource
				el = rowObj.getTr('event')
				elBottom = el.offset().top + el.outerHeight()

				if elBottom > scrollerTop
					scroll.resourceId = rowObj.resource.id
					scroll.bottom = elBottom - scrollerTop
					break

		# TODO: what about left scroll state for spreadsheet area?
		scroll


	applyResourceScroll: (scroll) ->
		if scroll.resourceId
			row = @getResourceRow(scroll.resourceId)
			if row
				el = row.getTr('event')
				if el
					innerTop = @timeBodyScroller.canvas.el.offset().top # TODO: use -scrollHeight or something
					elBottom = el.offset().top + el.outerHeight()
					scrollTop = elBottom - scroll.bottom - innerTop
					@timeBodyScroller.setScrollTop(scrollTop)
					@spreadsheet.bodyScroller.setScrollTop(scrollTop)


	scrollToResource: (resource) ->
		row = @getResourceRow(resource.id)
		if row
			el = row.getTr('event')
			if el
				innerTop = @timeBodyScroller.canvas.el.offset().top # TODO: use -scrollHeight or something
				scrollTop = el.offset().top - innerTop
				@timeBodyScroller.setScrollTop(scrollTop)
				@spreadsheet.bodyScroller.setScrollTop(scrollTop)


	# Hit System
	# ------------------------------------------------------------------------------------------------------------------


	prepareHits: ->
		super

		@eventRows = @getEventRows()
		@shownEventRows = (row for row in @eventRows when row.isShown)

		trArray =
			for row in @shownEventRows
				row.getTr('event')[0]

		@rowCoordCache = new CoordCache
			els: trArray
			isVertical: true
		@rowCoordCache.build()


	releaseHits: ->
		super
		@eventRows = null
		@shownEventRows = null
		@rowCoordCache.clear()


	queryHit: (leftOffset, topOffset) ->
		simpleHit = super
		if simpleHit
			rowIndex = @rowCoordCache.getVerticalIndex(topOffset)
			if rowIndex?
				{
					resourceId: @shownEventRows[rowIndex].resource.id
					snap: simpleHit.snap
					component: this # need this unfortunately :(
					left: simpleHit.left
					right: simpleHit.right
					top: @rowCoordCache.getTopOffset(rowIndex)
					bottom: @rowCoordCache.getBottomOffset(rowIndex)
				}


	getHitFootprint: (hit) ->
		componentFootprint = super
		new ResourceComponentFootprint(
			componentFootprint.unzonedRange
			componentFootprint.isAllDay
			hit.resourceId
		)


	getHitEl: (hit) ->
		@getSnapEl(hit.snap)


	# Resource Data
	# ------------------------------------------------------------------------------------------------------------------


	renderResources: (resources) ->
		for resource in resources
			@renderResource(resource)


	unrenderResources: ->
		@rowHierarchy.removeElement()
		@rowHierarchy.removeChildren()

		for id, row in @resourceRowHash
			@removeChild(row) # for DateComponent!

		@resourceRowHash = {}


	renderResource: (resource) ->
		row = @insertResource(resource)
		row.renderSkeleton()


	unrenderResource: (resource) ->
		row = @removeResource(resource)
		row.removeFromParentAndDom()


	# Event Rendering
	# ------------------------------------------------------------------------------------------------------------------


	executeEventRender: (eventsPayload) ->
		console.log('split', eventsPayload)
		# TODO: post-event-render hack
		# TODO: why so slow?
		# TODO: after first navigate, row heights scrunch
		return


	# Child Components
	# ------------------------------------------------------------------------------------------------------------------

	### TODO: review this...

	# business hours
	customBizGenCnt: 0
	fallbackBizGenForRows: null


	addChild: (rowObj) ->
		if rowObj.resource.businessHourGenerator # custom generator?
			rowObj.set('businessHourGenerator', rowObj.resource.businessHourGenerator)

			if (++@customBizGenCnt) == 1 # first row with a custom generator?

				# store existing general business hour generator
				if @has('businessHourGenerator')
					@fallbackBizGenForRows = @get('businessHourGenerator')
					@unset('businessHourGenerator')

					# apply to previously added rows without their own generator
					for otherRowObj in @getEventRows() # does not include rowObj
						if not otherRowObj.has('businessHourGenerator')
							otherRowObj.set('businessHourGenerator', @fallbackBizGenForRows)
		else
			if @fallbackBizGenForRows
				rowObj.set('businessHourGenerator', @fallbackBizGenForRows)

		super # add rowObj


	removeChild: (rowObj) ->
		super # remove rowObj

		if rowObj.resource.businessHourGenerator # had custom generator?

			if (--@customBizGenCnt) == 0 # no more custom generators?

				# reinstall previous general business hour generator
				if @fallbackBizGenForRows

					for otherRowObj in @getEventRows() # does not include rowObj
						if not otherRowObj.resource.businessHourGenerator # doesn't have custom def
							otherRowObj.unset('businessHourGenerator')

					@set('businessHourGenerator', @fallbackBizGenForRows)
					@fallbackBizGenForRows = null

		# remove the row's generator, regardless of how it was received
		rowObj.unset('businessHourGenerator')

	###


	# creates a row for the given resource and inserts it into the hierarchy.
	# if `parentResourceRow` is given, inserts it as a direct child
	# does not render
	insertResource: (resource, parentResourceRow) ->
		row = new ResourceRow(this, resource)

		if not parentResourceRow
			if resource.parent
				parentResourceRow = @getResourceRow(resource.parent.parentId)
			else if resource.parentId
				parentResourceRow = @getResourceRow(resource.parentId)

		if parentResourceRow
			@insertRowAsChild(row, parentResourceRow)
		else
			@insertRow(row)

		@addChild(row) # for DateComponent!
		@resourceRowHash[resource.id] = row

		for childResource in resource.children
			@insertResource(childResource, row)

		row


	# does not unrender
	removeResource: (resource) ->
		row = @resourceRowHash[resource.id]

		if row
			delete @resourceRowHash[resource.id]

			@removeChild(row) # for DateComponent!

			row.removeFromParentAndDom()

		row


	# inserts the given row into the hierarchy.
	# `parent` can be any tree root of the hierarchy.
	# `orderSpecs` will recursively create groups within the root before inserting the row.
	insertRow: (row, parent=@rowHierarchy, groupSpecs=@groupSpecs) ->
		if groupSpecs.length
			group = @ensureResourceGroup(row, parent, groupSpecs[0])

			if group instanceof HRowGroup
				@insertRowAsChild(row, group) # horizontal rows can only be one level deep
			else
				@insertRow(row, group, groupSpecs.slice(1))
		else
			@insertRowAsChild(row, parent)


	# inserts the given row as a direct child of the given parent
	insertRowAsChild: (row, parent) ->
		parent.addChild(row, @computeChildRowPosition(row, parent))


	# computes the position at which the given node should be inserted into the parent's children
	# if no specific position is determined, returns null
	computeChildRowPosition: (child, parent) ->
		if @orderSpecs.length
			for sibling, i in parent.children
				cmp = @compareResources(sibling.resource or {}, child.resource or {})
				if cmp > 0 # went 1 past. insert at i
					return i
		null


	# given two resources, returns a cmp value (-1, 0, 1)
	compareResources: (a, b) ->
		compareByFieldSpecs(a, b, @orderSpecs)


	# given information on how a row should be inserted into one of the parent's child groups,
	# ensure a child group exists, creating it if necessary, and then return it.
	# spec MIGHT NOT HAVE AN ORDER
	ensureResourceGroup: (row, parent, spec) ->
		groupValue = (row.resource or {})[spec.field] # the groupValue of the row
		group = null

		# find an existing group that matches, or determine the position for a new group
		if spec.order
			for testGroup, i in parent.children
				cmp = flexibleCompare(testGroup.groupValue, groupValue) * spec.order
				if cmp == 0 # an exact match with an existing group
					group = testGroup
					break
				else if cmp > 0 # the row's desired group is after testGroup. insert at this position
					break
		else # the groups are unordered
			for testGroup, i in parent.children
				if testGroup.groupValue == groupValue
					group = testGroup
					break
			# `i` will be at the end if group was not found

		# create a new group
		if not group
			if @isVGrouping
				group = new VRowGroup(this, spec, groupValue)
			else
				group = new HRowGroup(this, spec, groupValue)
			parent.addChild(group, i)

		group


	# Row Rendering
	# ------------------------------------------------------------------------------------------------------------------


	descendantAdded: (row) ->
		wasNesting = @isNesting
		isNesting = Boolean(
			@nestingCnt += if row.depth then 1 else 0
		)

		if wasNesting != isNesting

			@requestRender =>
				@el.toggleClass('fc-nested', isNesting)
					.toggleClass('fc-flat', not isNesting)

			@isNesting = isNesting


	descendantRemoved: (row) ->
		wasNesting = @isNesting
		isNesting = Boolean(
			@nestingCnt -= if row.depth then 1 else 0
		)

		if wasNesting != isNesting

			@requestRender =>
				@el.toggleClass('fc-nested', isNesting)
					.toggleClass('fc-flat', not isNesting)

			@isNesting = isNesting


	descendantShown: (row) ->
		# RowParent needs this


	descendantHidden: (row) ->
		# RowParent needs this


	# visibleRows is flat. does not do recursive
	syncRowHeights: (visibleRows, safe=false) ->

		visibleRows ?= @getVisibleRows()

		for row in visibleRows
			row.setTrInnerHeight('')

		innerHeights = for row in visibleRows
			h = row.getMaxTrInnerHeight()
			if safe
				h += h % 2 # FF and zoom only like even numbers for alignment
			h

		for row, i in visibleRows
			row.setTrInnerHeight(innerHeights[i])

		if not safe
			h1 = @spreadsheet.tbodyEl.height()
			h2 = @timeBodyTbodyEl.height()
			if Math.abs(h1 - h2) > 1
				@syncRowHeights(visibleRows, true)


	# Row Querying
	# ------------------------------------------------------------------------------------------------------------------


	getVisibleRows: ->
		row for row in @rowHierarchy.getRows() when row.isShown


	getEventRows: ->
		row for row in @rowHierarchy.getRows() when row instanceof EventRow


	getResourceRow: (resourceId) ->
		@resourceRowHash[resourceId]


	# Selection
	# ------------------------------------------------------------------------------------------------------------------


	renderSelectionFootprint: (componentFootprint) ->
		if componentFootprint.resourceId
			rowObj = @getResourceRow(componentFootprint.resourceId)
			if rowObj
				rowObj.renderSelectionFootprint(componentFootprint)
		else
			super


	# Event Resizing (route to rows)
	# ------------------------------------------------------------------------------------------------------------------


	renderEventResize: (eventFootprints, seg, isTouch) ->
		map = groupEventFootprintsByResourceId(eventFootprints)

		for resourceId, resourceEventFootprints of map
			rowObj = @getResourceRow(resourceId)

			# render helpers
			rowObj.helperRenderer.renderEventDraggingFootprints(resourceEventFootprints, seg, isTouch)

			# render highlight
			for eventFootprint in resourceEventFootprints
				rowObj.renderHighlight(eventFootprint.componentFootprint)


	unrenderEventResize: ->
		for rowObj in @getEventRows()
			rowObj.helperRenderer.unrender()
			rowObj.unrenderHighlight()


	# DnD (route to rows)
	# ------------------------------------------------------------------------------------------------------------------


	renderDrag: (eventFootprints, seg, isTouch) ->
		map = groupEventFootprintsByResourceId(eventFootprints)

		if seg
			# draw helper
			for resourceId, resourceEventFootprints of map
				rowObj = @getResourceRow(resourceId)
				rowObj.helperRenderer.renderEventDraggingFootprints(resourceEventFootprints, seg, isTouch)

			true # signal helper rendered
		else
			# draw highlight
			for resourceId, resourceEventFootprints of map
				for eventFootprint in resourceEventFootprints
					rowObj = @getResourceRow(resourceId)
					rowObj.renderHighlight(eventFootprint.componentFootprint)

			false # signal helper not rendered


	unrenderDrag: ->
		for rowObj in @getEventRows()
			rowObj.helperRenderer.unrender()
			rowObj.unrenderHighlight()


# Utils
# ------------------------------------------------------------------------------------------------------------------


groupEventFootprintsByResourceId = (eventFootprints) ->
	map = {}

	for eventFootprint in eventFootprints
		(map[eventFootprint.componentFootprint.resourceId] or= [])
			.push(eventFootprint)

	map
