
###
An abstract node in a row-hierarchy tree.
May be a self-contained single row, a row with subrows,
OR a grouping of rows without its own distinct row.
###
class RowParent

	view: null # the calendar View object. all nodes have this
	parent: null # parent node. null if topmost parent
	prevSibling: null # node before this node. null if first sibling
	children: null # array of child nodes
	depth: 0 # number of row-levels deep from top of hierarchy. Nodes without rows aren't counted

	hasOwnRow: false # is this node responsible for rendering its own distinct row?
	trHash: null # TR jq objects owned by the node. keyed by "type" (parallel row sections in different tbodies)
	trs: null # single jQuery object of tr elements owned by the node.

	isRendered: false # has this single node been rendered? (possible for it to be hidden after though)
	isExpanded: true # does this node have its child nodes revealed?
	isShown: false # does this node's parent have this node revealed? and is it rendered too?

	constructor: (@view) ->
		@children = []
		@trHash = {}
		@trs = $()


	# Hierarchy
	# ------------------------------------------------------------------------------------------------------------------

	###
	Adds the given node as a child.
	Will be inserted at the `index`. If not given, will be appended to the end.
	###
	addChild: (child, index) ->
		child.remove() # in case it belonged somewhere else previously
		children = @children

		# insert into the children array
		if index?
			children.splice(index, 0, child)
		else
			index = children.length
			children.push(child)

		# compute the previous sibling of child
		child.prevSibling =
			if index > 0
				children[index - 1]
			else
				null

		# update the next sibling's prevSibling
		if index < children.length - 1
			children[index + 1].prevSibling = child

		child.parent = this
		child.depth = @depth + (if @hasOwnRow then 1 else 0)

		# trigger the "added" callback for all nodes in the subtree
		for node in child.getNodes()
			node.added()

		# if this node is currently displayed and expanded, display the child as well. will trigger shown handlers
		if @isShown and @isExpanded
			child.show()

	###
	Removes the given child from the node. Assumes it is a direct child.
	If not a direct child, returns false and nothing happens.
	Unrenders the child and triggers handlers.
	###
	removeChild: (child) ->
		children = @children
		isFound = false

		# look for the node in the children array
		for testChild, i in children
			if testChild == child # found!
				isFound = true
				break # after this, `i` will contain the index

		if not isFound
			false # return false if not found
		else
			# rewire the next sibling's prevSibling to skip
			if i < children.length - 1 # there must be a next sibling
				children[i + 1].prevSibling = child.prevSibling

			children.splice(i, 1) # remove node from the array
			child.recursivelyUnrender() # unrender the subtree. will trigger "hidden" callbacks

			# trigger the "removed" callback for all nodes in the subtree
			# do this before destroying the parent/child relationship
			for row in child.getNodes()
				row.removed()

			# unwire child from the parent/siblings
			child.parent = null
			child.prevSibling = null

			child # return on success

	###
	Removes all of the node's children from the hierarchy. Unrenders them and triggers callbacks.
	NOTE: batchRows/unbatchRows should probably be called before this happens :(
	###
	removeChildren: ->

		# unrender each child's subtree
		for child in @children
			child.recursivelyUnrender()

		# trigger "removed" callbacks on all nodes in the subtree
		for child in @getDescendants()
			child.removed()

		@children = []

	###
	Removes this node from its parent
	###
	remove: ->
		if @parent
			@parent.removeChild(this)

	###
	Gets the last direct child node
	###
	getLastChild: ->
		children = @children
		children[children.length - 1]

	###
	Walks backward in the hierarchy to find the previous row leaf node.
	When looking at the hierarchy in a flat linear fashion, this is the revealed row just before the current.
	###
	getPrevRow: ->
		node = this
		while node
			if node.prevSibling
				# attempt to go into the deepest last child of the previous sibling
				node = node.prevSibling
				while (lastChild = node.getLastChild())
					node = lastChild
			else
				# otherwise, move up to the parent
				node = node.parent

			# return this "previous" node if it has an exposed row
			if node and node.hasOwnRow and node.isShown
				return node
		null

	###
	Returns the first node in the subtree that has a revealed row
	###
	getLeadingRow: ->
		if @hasOwnRow
			this
		else if @isExpanded and @children.length
			@children[0].getLeadingRow()

	###
	Generates a flat array containing all the row-nodes of the subtree. Descendants + self
	###
	getRows: (batchArray=[]) ->
		if @hasOwnRow
			batchArray.push(this)

		for child in @children
			child.getRows(batchArray)

		batchArray

	###
	Generates a flat array containing all the nodes (row/non-row) of the subtree. Descendants + self
	###
	getNodes: (batchArray=[]) ->
		batchArray.push(this)

		for child in @children
			child.getNodes(batchArray)

		batchArray

	###
	Generates a flat array containing all the descendant nodes the current node
	###
	getDescendants: ->
		batchArray = []

		for child in @children
			child.getNodes(batchArray)

		batchArray


	# Rendering
	# ------------------------------------------------------------------------------------------------------------------

	###
	Builds and populates the TRs for each row type. Inserts them into the DOM.
	Does this only for this single row. Not recursive. If not a row (hasOwnRow=false), does not render anything.
	PRECONDITION: assumes the parent has already been rendered.
	###
	render: ->
		@trHash = {}
		trNodes = []

		if @hasOwnRow # only bother rendering TRs if we know this node has a real row
			prevRow = @getPrevRow() # the row before this row, in the overall linear flat list

			# let the view's tbody structure determine which TRs should be rendered
			for type, tbody of @view.tbodyHash

				# build the TR and record it
				# assign before calling the render methods, because they might rely
				tr = $('<tr/>')
				@trHash[type] = tr
				trNodes.push(tr[0])

				# call the subclass' render method for this row type (if available)
				renderMethodName = 'render' + capitaliseFirstLetter(type) + 'Content'
				if this[renderMethodName]
					this[renderMethodName](tr)

				# insert the TR into the DOM
				if prevRow
					prevRow.trHash[type].after(tr)
				else
					tbody.prepend(tr) # belongs in the very first position

		# build a single jQuery object. use event delegation for calling toggleExpanded
		@trs = $(trNodes)
			.on('click', '.fc-expander', proxy(this, 'toggleExpanded'))

		@isRendered = true

	###
	Unpopulates and removes all of this row's TRs from the DOM. Only for this single row. Not recursive.
	Will trigger "hidden".
	###
	unrender: ->
		if @isRendered

			# call the subclass' render method for each row type (if available)
			for type, tr of @trHash
				unrenderMethodName = 'unrender' + capitaliseFirstLetter(type) + 'Content'
				if this[unrenderMethodName]
					this[unrenderMethodName](tr)

			@trHash = {}
			@trs.remove() # remove from DOM
			@trs = $()

			@isRendered = false
			@isShown = false # isShown assumes rendering has happened too, so change it to false
			@hidden() # trigger

	###
	Like unrender(), but does it for this row AND all descendants.
	NOTE: batchRows/unbatchRows should probably be called before this happens :(
	###
	recursivelyUnrender: ->
		@unrender()

		for child in @children
			child.recursivelyUnrender()

	###
	A simple getter for retrieving a TR jQuery object of a certain row type
	###
	getTr: (type) ->
		@trHash[type]


	# Hiding / Showing
	# ------------------------------------------------------------------------------------------------------------------

	###
	Renders this row if not already rendered, making sure it is visible.
	Also renders descendants of this subtree, based on whether they are expanded or not.
	NOTE: If called externally, batchRows/unbatchRows should probably be called before this happens :(
	###
	show: ->
		if not @isShown

			if not @isRendered
				@render()
			else
				@trs.css('display', '') # remove display:none

			# TODO: hack specific to EventRow.
			# the re-display might not have rendered new segs
			if @ensureSegsRendered
				@ensureSegsRendered()

			# update the expander icon
			if @isExpanded
				@indicateExpanded()
			else
				@indicateCollapsed()

			@isShown = true
			@shown() # trigger
			
			# show all children only if we know this node is in an expanded state
			if @isExpanded
				for child in @children
					child.show()

	###
	Temporarily hides this node's TRs (if applicable) as well as all nodes in the subtree
	###
	hide: ->
		if @isShown

			if @isRendered
				@trs.hide()

			@isShown = false
			@hidden() # trigger

			# hide all children only if we know this node was previously expanded.
			# done so handlers get triggered.
			if @isExpanded
				for child in @children
					child.hide()


	# Expanding / Collapsing
	# ------------------------------------------------------------------------------------------------------------------
	# Use by row groups and rows with subrows

	###
	Reveals this node's children if they have not already been revealed. Changes any expander icon.
	###
	expand: ->
		if not @isExpanded
			@isExpanded = true
			@indicateExpanded()

			# show all the children
			# one of the only places in this class where we explicitly batch/unbatch :(
			@view.batchRows()
			for child in @children
				child.show()
			@view.unbatchRows()

			@animateExpand()

	###
	Hides this node's children if they are not already hidden. Changes any expander icon.
	###
	collapse: ->
		if @isExpanded
			@isExpanded = false
			@indicateCollapsed()

			# hide all the children
			# one of the only places in this class where we explicitly batch/unbatch :(
			@view.batchRows()
			for child in @children
				child.hide()
			@view.unbatchRows()

	###
	Switches between expanded/collapsed states
	###
	toggleExpanded: ->
		if @isExpanded
			@collapse()
		else
			@expand()

	###
	Changes the expander icon to the "expanded" state
	###
	indicateExpanded: ->
		@trs.find('.fc-expander .fc-icon')
			.removeClass(@getCollapsedIcon())
			.addClass(@getExpandedIcon())

	###
	Changes the expander icon to the "collapsed" state
	###
	indicateCollapsed: ->
		@trs.find('.fc-expander .fc-icon')
			.removeClass(@getExpandedIcon())
			.addClass(@getCollapsedIcon())

	###
	###
	enableExpanding: ->
		@trs.find('.fc-expander-space')
			.addClass('fc-expander')

	###
	###
	disableExpanding: ->
		@trs.find('.fc-expander-space')
			.removeClass('fc-expander')
			.find('.fc-icon')
				.removeClass(@getExpandedIcon())
				.removeClass(@getCollapsedIcon())


	getExpandedIcon: ->
		'fc-icon-down-triangle'


	getCollapsedIcon: ->
		dir = if @view.isRTL then 'left' else 'right'
		'fc-icon-' + dir + '-triangle'
		

	###
	Causes a slide-down CSS transition to demonstrate that the expand has happened
	###
	animateExpand: ->
		trs = @children[0]?.getLeadingRow()?.trs # the first child row's TRs
		if trs
			trs.addClass('fc-collapsed')

			setTimeout -> # wait for browser to render collapsed state
				trs.addClass('fc-transitioning') # enable transitioning
				trs.removeClass('fc-collapsed') # transition back to non-collapsed state

			# cross-browser way to determine when the transition finishes
			trs.one 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', ->
				trs.removeClass('fc-transitioning') # will remove the overflow:hidden

	# Sizing
	# ------------------------------------------------------------------------------------------------------------------

	###
	Find each TRs "inner div" (div within first cell). This div controls each TRs height.
	Returns the max pixel height.
	###
	getMaxTrInnerHeight: ->
		max = 0
		$.each @trHash, (type, tr) =>
			# exclude multi-rowspans (probably done for row grouping)
			innerEl = getOwnCells(tr).find('> div:not(.fc-cell-content):first')
			max = Math.max(innerEl.height(), max)
		max

	###
	Find each TRs "inner div" and sets all of their heights to the same value.
	###
	setTrInnerHeight: (height) ->
		# exclude multi-rowspans (probably done for row grouping)
		$.each @trHash, (type, tr) =>
			getOwnCells(tr).find('> div:not(.fc-cell-content):first')
				.height(height)


	# Triggering
	# ------------------------------------------------------------------------------------------------------------------

	###
	Triggered when the current node has been shown (either freshly rendered or re-shown)
	when it had previously been unrendered or hidden. `shown` does not bubble up the hierarchy.
	###
	shown: ->
		if @hasOwnRow
			@rowShown(this)

	###
	Triggered when the current node has been hidden (either temporarily or permanently)
	when it had previously been shown. `hidden` does not bubble up the hierarchy.
	###
	hidden: ->
		if @hasOwnRow
			@rowHidden(this)

	###
	Just like `shown`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
	###
	rowShown: (row) ->
		(@parent or @view).rowShown(row)

	###
	Just like `hidden`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
	###
	rowHidden: (row) ->
		(@parent or @view).rowHidden(row)

	###
	Triggered when the current node has been added to the hierarchy. `added` does not bubble up.
	###
	added: ->
		if @hasOwnRow
			@rowAdded(this)

	###
	Triggered when the current node has been removed from the hierarchy. `removed` does not bubble up.
	###
	removed: ->
		if @hasOwnRow
			@rowRemoved(this)

	###
	Just like `added`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
	###
	rowAdded: (row) ->
		(@parent or @view).rowAdded(row)

	###
	Just like `removed`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
	###
	rowRemoved: (row) ->
		(@parent or @view).rowRemoved(row)
