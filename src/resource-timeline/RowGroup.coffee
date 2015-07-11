
###
An abstract node in a row-hierarchy tree that contains other nodes.
Will have some sort of rendered label indicating the grouping,
up to the subclass for determining what to do with it.
###
class RowGroup extends RowParent

	groupSpec: null # information about the field by which we are grouping {field,order,text,render}
	groupValue: null # the actual value of the field by which the resources are grouped


	constructor: (view, @groupSpec, @groupValue) ->
		super

	###
	Called when this row (if it renders a row) or a subrow is removed
	###
	rowRemoved: (row) ->
		super # bubble up to the view and let the node be fully removed

		# if the row that was removed was a subnode (not *this* node)
		# and there are no more children in the group, implictly remove this group as well
		if row != this and not @children.length
			@remove()

	###
	Renders the content wrapper element that will be inserted into this row's TD cell
	###
	renderGroupContentEl: ->
		contentEl = $('<div class="fc-cell-content" />')
			.append(@renderGroupTextEl())

		filter = @groupSpec.render
		if typeof filter == 'function'
			contentEl = filter(contentEl, @groupValue) or contentEl

		contentEl

	###
	Renders the text span element that will be inserted into this row's TD cell.
	Goes within the content element.
	###
	renderGroupTextEl: ->
		text = @groupValue or '' # might be null/undefined if an ad-hoc grouping

		filter = @groupSpec.text
		if typeof filter == 'function'
			text = filter(text) or text

		$('<span class="fc-cell-text" />').text(text)