
class ResourceTimelineView extends TimelineView

	# configuration for DateComponent monkeypatch
	# means that is takes responsibility for rendering own resources
	isResourceRenderingEnabled: true

	# configuration for View monkeypatch
	baseRenderRequiresResources: true

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


	constructor: ->
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
		# ^ is not a Grid/DateComponent


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
				@calendar.updateViewSize() # if in render queue, will wait until end

			dragEnd: =>
				@dividerEls.removeClass('fc-active')

		dragListener.startInteraction(ev)


	getNaturalDividerWidth: ->
		@el.find('.fc-resource-area').width() # TODO: don't we have this cached?


	positionDivider: (w) ->
		@el.find('.fc-resource-area').width(w) # TODO: don't we have this cached?


	# Sizing
	# ---------------------------------------------------------------------------------


	updateSize: (totalHeight, isAuto, isResize) ->
		@resourceGrid.updateSize()
		@joiner.update()

		if @cellFollower
			@cellFollower.update()

		# TODO: smarter about not doing this every time, if a single resource is added/removed
		@syncRowHeights()

		headHeight = @syncHeadHeights()

		if isAuto
			bodyHeight = 'auto'
		else
			bodyHeight = totalHeight - headHeight - @queryMiscHeight()

		@timeGrid.bodyScroller.setHeight(bodyHeight)
		@resourceGrid.bodyScroller.setHeight(bodyHeight)

		# do children AFTER because of ScrollFollowerSprite abs position issues
		super


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


	# Resource Data
	# ------------------------------------------------------------------------------------------------------------------


	handleResourceAdd: (resource) ->
		super

		rowObj = @insertResource(resource)

		# TODO: we aren't using renderResourceAdd,
		# so prevent empty function from queueing
		if @has('displayingResources')
			@requestRender 'resource', 'add', ->
				rowObj.renderSkeleton() # recursive
				@reinitializeCellFollowers()


	handleResourceRemove: (resource) ->
		super

		rowObj = @getResourceRow(resource.id)

		if rowObj
			@timeGrid.removeChild(rowObj)
			delete @resourceRowHash[resource.id]

			if @has('displayingResources')
				# TODO: we aren't using renderResourceAdd,
				# so prevent empty function from queueing
				@requestRender 'resource', 'remove', ->
					rowObj.removeFromParentAndDom()
					@reinitializeCellFollowers()
			else
				rowObj.removeFromParentAndDom()


	# High-Level Resource Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderResources: (resources) ->
		@rowHierarchy.renderSkeleton() # recursive
		@reinitializeCellFollowers()


	unrenderResources: ->
		@rowHierarchy.removeElement() # recursive
		@reinitializeCellFollowers()


	# Row Hierarchy Building
	# ------------------------------------------------------------------------------------------------------------------
	# TODO: really bad names for addChild/removeChild (DateComponent!)


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

		@timeGrid.addChild(row)
		@resourceRowHash[resource.id] = row

		for childResource in resource.children
			@insertResource(childResource, row)

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

			@requestRender 'nesting', 'update', => # TODO: allow anon tasks
				@el.toggleClass('fc-nested', isNesting)
					.toggleClass('fc-flat', not isNesting)

			@isNesting = isNesting


	descendantRemoved: (row) ->
		wasNesting = @isNesting
		isNesting = Boolean(
			@nestingCnt -= if row.depth then 1 else 0
		)

		if wasNesting != isNesting

			@requestRender 'nesting', 'update', => # TODO: allow anon tasks
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
	# this is useful for scrolling prev/next dates while resource is scrolled down


	queryResourceScroll: ->
		scroll = {}

		scrollerTop = @timeGrid.bodyScroller.scrollEl.offset().top # TODO: use getClientRect

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
					innerTop = @timeGrid.bodyScroller.canvas.el.offset().top # TODO: use -scrollHeight or something
					elBottom = el.offset().top + el.outerHeight()
					scrollTop = elBottom - scroll.bottom - innerTop
					@timeGrid.bodyScroller.setScrollTop(scrollTop)
					@resourceGrid.bodyScroller.setScrollTop(scrollTop)


	scrollToResource: (resource) ->
		row = @getResourceRow(resource.id)
		if row
			el = row.getTr('event')
			if el
				innerTop = @timeGrid.bodyScroller.canvas.el.offset().top # TODO: use -scrollHeight or something
				scrollTop = el.offset().top - innerTop
				@timeGrid.bodyScroller.setScrollTop(scrollTop)
				@resourceGrid.bodyScroller.setScrollTop(scrollTop)


	# for resource text in columns of row groupings
	# https://fullcalendar.io/js/fullcalendar-scheduler-1.6.2/demos/column-grouping.html
	# ------------------------------------------------------------------------------------------------------------------
	# TODO: optimize this
	# TODO: destroy all scrollfollowers when the View's skeleton is destroyed

	cellFollower: null


	# wrapper for things
	reinitializeCellFollowers: ->
		if @cellFollower
			@cellFollower.clearSprites() # the closest thing to a destroy

		@cellFollower = new ScrollFollower(@resourceGrid.bodyScroller, true) # allowPointerEvents
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


# Watcher Garbage for Rows
# ---------------------------------------------------------------------------------------------------------------------


###
generates the initial ResourceRows (aka EventRows)
###
ResourceTimelineView.watch 'resourceRows', [ 'hasResources' ], ->
	resources = @get('currentResources')

	for resource in resources
		@insertResource(resource)
	return
, ->
	@rowHierarchy.removeChildren()
	@timeGrid.removeChildren()
	@resourceRowHash = {}


###
assigns a dateProfile to each EventRow
dateProfiles are needed for event rendering
###
ResourceTimelineView.watch 'settingDateProfileInRows', [ 'resourceRows', 'dateProfile' ], (deps) ->
	for rowObj in @getEventRows()
		rowObj.set('dateProfile', deps.dateProfile)
	return
, ->
	for rowObj in @getEventRows()
		rowObj.unset('dateProfile')
	return


###
assigns a dateProfile to each EventRow
dateProfiles are needed for event rendering
###
ResourceTimelineView.watch 'settingEventsInRows', [ 'resourceRows', 'hasEvents' ], ->
	eventsPayload = @get('currentEvents')
	resourcePayloads = {}

	for eventId, eventInstanceGroup of eventsPayload
		eventDef = eventInstanceGroup.getEventDef()

		for resourceId in eventDef.getResourceIds()
			resourcePayload = (resourcePayloads[resourceId] or= {})
			resourcePayload[eventId] = eventInstanceGroup

	for rowObj in @getEventRows()
		rowObj.handleEventsSet(resourcePayloads[rowObj.resource.id] or [])
, ->
	for rowObj in @getEventRows()
		rowObj.handleEventsUnset()


###
waits to render resources until all rows are created.
initialized via function. we need to do the same to override.
###
ResourceTimelineView::watchDisplayingResources = ->
	@watch 'displayingResources', [ 'resourceRows' ], =>
		@requestRender('resource', 'init', @executeResourcesRender, [ @get('currentResources') ])
	, =>
		@requestRender('resource', 'destroy', @executeResourcesUnrender)
