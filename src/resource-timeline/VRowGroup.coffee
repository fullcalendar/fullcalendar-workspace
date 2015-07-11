
###
A row grouping that renders as a tall multi-cell vertical span in the "spreadsheet" area
###
class VRowGroup extends RowGroup

	rowspan: 0 # the number of total rows (subparents included) this group spans
	leadingTr: null # the first real row's TR in the group
	groupTd: null # the TD that spans vertically

	###
	Called when a row somewhere within the grouping is shown
	###
	rowShown: (row) ->
		@rowspan += 1
		@renderRowspan()
		super # will bubble to parent

	###
	Called when a row somewhere within the grouping is hidden
	###
	rowHidden: (row) ->
		@rowspan -= 1
		@renderRowspan()
		super # will bubble to parent

	###
	Makes sure the groupTd has the correct rowspan / place in the DOM.
	PRECONDITION: in the case of multiple group nesting, a child's renderRowspan()
	will be called before the parent's renderRowspan().
	###
	renderRowspan: ->
		if @rowspan # takes up at least one row?

			# ensure the TD element
			if not @groupTd
				@groupTd = $('<td class="' + @view.widgetContentClass + '"/>')
					.append(@renderGroupContentEl())

			@groupTd.attr('rowspan', @rowspan)

			# (re)insert groupTd if it was never inserted, or the first TR is different
			leadingTr = @getLeadingRow().getTr('spreadsheet')
			if leadingTr != @leadingTr
				if leadingTr # might not exist if child was unrendered before parent
					leadingTr.prepend(@groupTd) # parents will later prepend their own
				@leadingTr = leadingTr

		else # takes up zero rows?

			# remove the TD element if it was rendered
			if @groupTd
				@groupTd.remove()
				@groupTd = null

			@leadingTr = null
