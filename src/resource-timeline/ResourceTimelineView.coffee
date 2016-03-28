
class ResourceTimelineView extends TimelineView

	@mixin ResourceViewMixin


	resourceGrid: null # TODO: rename
	tbodyHash: null # used by RowParent
	joiner: null
	dividerEls: null

	superHeaderText: null
	isVGrouping: null
	isHGrouping: null
	groupSpecs: null
	colSpecs: null
	orderSpecs: null # each spec will always have an order

	# a "spec" is a name of a resource field, with an optional "order"

	rowHierarchy: null
	resourceRowHash: null
	nestingCnt: 0
	isNesting: null

	dividerWidth: null


	initialize: ->
		super
		@processResourceOptions()
		@resourceGrid = new Spreadsheet(this)
		@rowHierarchy = new RowParent(this)
		@resourceRowHash = {}


	instantiateGrid: ->
		new ResourceTimelineGrid(this)


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


	renderSkeleton: ->
		super

		@renderResourceGridSkeleton()

		@tbodyHash = { # needed for rows to render
			spreadsheet: @resourceGrid.tbodyEl
			event: @timeGrid.tbodyEl
		}

		@joiner = new ScrollJoiner('vertical', [
			@resourceGrid.bodyScroller
			@timeGrid.bodyScroller
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


	renderResourceGridSkeleton: ->
		@resourceGrid.el = @el.find('tbody .fc-resource-area')
		@resourceGrid.headEl = @el.find('thead .fc-resource-area')
		@resourceGrid.renderSkeleton()


	# Divider moving
	# ---------------------------------------------------------------------------------


	initDividerMoving: ->
		@dividerEls = @el.find('.fc-divider')

		@dividerWidth = @opt('resourceAreaWidth') ? @resourceGrid.tableWidth # tableWidth available after resourceGrid.renderSkeleton
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
				@updateWidth() # TODO: only do this at the very end?

			dragEnd: =>
				@dividerEls.removeClass('fc-active')

		dragListener.startInteraction(ev)


	getNaturalDividerWidth: ->
		@el.find('.fc-resource-area').width() # TODO: don't we have this cached?


	positionDivider: (w) ->
		@el.find('.fc-resource-area').width(w) # TODO: don't we have this cached?


	# Events
	# ---------------------------------------------------------------------------------


	renderEvents: (events) ->
		@timeGrid.renderEvents(events)
		@syncRowHeights()
		@updateWidth()


	unrenderEvents: ->
		@timeGrid.unrenderEvents()
		@syncRowHeights()
		@updateWidth()


	# Sizing
	# ---------------------------------------------------------------------------------


	updateWidth: ->
		super
		@resourceGrid.updateWidth()
		@joiner.update()

		if @cellFollower
			@cellFollower.update()


	updateHeight: (isResize) ->
		super
		if isResize
			@syncRowHeights()


	setHeight: (totalHeight, isAuto) ->
		headHeight = @syncHeadHeights()

		if isAuto
			bodyHeight = 'auto'
		else
			bodyHeight = totalHeight - headHeight - @queryMiscHeight()

		@timeGrid.bodyScroller.setHeight(bodyHeight)
		@resourceGrid.bodyScroller.setHeight(bodyHeight)


	queryMiscHeight: ->
		@el.outerHeight() -
			Math.max(@resourceGrid.headScroller.el.outerHeight(), @timeGrid.headScroller.el.outerHeight()) -
			Math.max(@resourceGrid.bodyScroller.el.outerHeight(), @timeGrid.bodyScroller.el.outerHeight())


	syncHeadHeights: ->
		@resourceGrid.headHeight('auto')
		@timeGrid.headHeight('auto')

		headHeight = Math.max(@resourceGrid.headHeight(), @timeGrid.headHeight())

		@resourceGrid.headHeight(headHeight)
		@timeGrid.headHeight(headHeight)

		headHeight


	# TODO: best place for this?
	scrollToResource: (resource) ->
		@timeGrid.scrollToResource(resource)


	# Resource Setting / Unsetting
	# ------------------------------------------------------------------------------------------------------------------


	setResources: (resources) ->
		@batchRows()
		for resource in resources
			@insertResource(resource)
		@rowHierarchy.show() # will trigger rowShown
		@unbatchRows()

		@reinitializeCellFollowers()


	unsetResources: ->
		@clearEvents()

		@batchRows()
		@rowHierarchy.removeChildren() # will trigger rowHidden
		@unbatchRows()

		@reinitializeCellFollowers()


	###
	TODO: the scenario where there were previously unassociated events that are now
	 attached to this resource. should render those events immediately.

	Responsible for rendering the new resource
	###
	addResource: (resource) ->
		@insertResource(resource)
		@reinitializeCellFollowers()


	# Responsible for unrendering the old resource
	removeResource: (resource) ->
		row = @getResourceRow(resource.id)
		if row
			@batchRows() # because multiple rows might be hidden (empty groups)
			row.remove()
			@unbatchRows()

			@reinitializeCellFollowers()


	# TODO: optimize this
	# TODO: destroy all scrollfollowers when the View's skeleton is destroyed

	cellFollower: null

	reinitializeCellFollowers: ->
		if @cellFollower
			@cellFollower.clearSprites() # the closest thing to a destroy

		@cellFollower = new ScrollFollower(@resourceGrid.bodyScroller, @calendar.isTouch)
		@cellFollower.isHFollowing = false
		@cellFollower.isVFollowing = true

		nodes = []
		for row in @rowHierarchy.getNodes()
			if row instanceof VRowGroup
				if row.groupTd
					cellContent = row.groupTd.find('.fc-cell-content')
					if cellContent.length
						nodes.push(cellContent[0])

		@cellFollower.setSprites($(nodes))


	# creates a row for the given resource and inserts it into the hierarchy.
	# if `parentResourceRow` is given, inserts it as a direct child
	insertResource: (resource, parentResourceRow) ->
		row = new ResourceRow(this, resource)

		if not parentResourceRow?
			parentId = resource.parentId
			if parentId
				parentResourceRow = @getResourceRow(parentId)

		if parentResourceRow
			@insertRowAsChild(row, parentResourceRow)
		else
			@insertRow(row)

		for childResource in resource.children
			@insertResource(childResource, row)


	# Row Hierarchy Building
	# ------------------------------------------------------------------------------------------------------------------


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


	# Row *Event* Utilities
	# ------------------------------------------------------------------------------------------------------------------


	# produces array of [ rowObj, segs ]
	# segs that don't have any resourceId won't be paired
	pairSegsWithRows: (segs) ->
		pairs = []
		pairsById = {}

		for seg in segs
			resourceId = seg.resourceId
			if resourceId
				rowObj = @getResourceRow(resourceId)
				if rowObj
					pair = pairsById[resourceId]
					if not pair
						pair = [ rowObj, [] ]
						pairs.push(pair)
						pairsById[resourceId] = pair
					pair[1].push(seg)
		pairs


	# Row Rendering
	# ------------------------------------------------------------------------------------------------------------------


	# this needs to exist even when no adhoc???
	rowAdded: (row) ->
		if row instanceof ResourceRow
			@resourceRowHash[row.resource.id] = row

		# TODO: consolidate repeat code
		wasNesting = @isNesting
		isNesting = Boolean(
			@nestingCnt += if row.depth then 1 else 0
		)
		if wasNesting != isNesting
			@el.toggleClass('fc-nested', isNesting)
			@el.toggleClass('fc-flat', not isNesting)
		@isNesting = isNesting


	# this needs to exist even when no adhoc???
	rowRemoved: (row) ->
		if row instanceof ResourceRow
			delete @resourceRowHash[row.resource.id]

		# TODO: consolidate repeat code
		wasNesting = @isNesting
		isNesting = Boolean(
			@nestingCnt -= if row.depth then 1 else 0
		)
		if wasNesting != isNesting
			@el.toggleClass('fc-nested', isNesting)
			@el.toggleClass('fc-flat', not isNesting)
		@isNesting = isNesting


	batchRowDepth: 0
	shownRowBatch: null
	hiddenRowBatch: null


	batchRows: ->
		if not (@batchRowDepth++) # was zero before incrementing?
			@shownRowBatch = []
			@hiddenRowBatch = []


	unbatchRows: ->
		if not (--@batchRowDepth) # is zero after decrementing?

			if @hiddenRowBatch.length
				@rowsHidden(@hiddenRowBatch)

			if @shownRowBatch.length
				@rowsShown(@shownRowBatch)

			@hiddenRowBatch = null
			@shownRowBatch = null


	# Called when one or more rows that were not rendered or previously hidden become visible
	rowShown: (row) ->
		if @shownRowBatch
			@shownRowBatch.push(row)
		else
			@rowsShown([ row ])


	# Called when one or more rows that were previously shown become hidden
	rowHidden: (row) ->
		if @hiddenRowBatch
			@hiddenRowBatch.push(row)
		else
			@rowsHidden([ row ])


	rowsShown: (rows) ->
		@syncRowHeights(rows)
		@updateWidth()


	rowsHidden: (rows) ->
		@updateWidth()


	syncRowHeights: (visibleRows, safe=false) -> # visibleRows is flat. does not do recursive

		# TODO: always restore scroll state afterwards
		# (because it gets unrendered)

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
			h1 = @resourceGrid.tbodyEl.height()
			h2 = @timeGrid.tbodyEl.height()
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


	# Scrolling
	# ---------------------------------------------------------------------------------
	# TODO: kill this


	setScroll: (state) ->
		super # set the timegrid's scroll

		# TODO: hack
		# Similar to what is happening in TimelineGrid::setScroll. for FF
		@resourceGrid.bodyScroller.setScrollTop(state.top)
