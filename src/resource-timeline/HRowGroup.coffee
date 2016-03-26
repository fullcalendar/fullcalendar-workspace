
###
A row grouping that renders as a single solid row that spans width-wise (like a horizontal rule)
###
class HRowGroup extends RowGroup

	hasOwnRow: true # actually renders its own row and takes up height

	###
	Renders this row's TR for the "spreadsheet" quadrant, the area with info about each resource
	###
	renderSpreadsheetContent: (tr) ->
		contentEl = @renderGroupContentEl()

		# add an expander icon. binding handlers and updating are done by RowParent
		contentEl.prepend(
			'<span class="fc-expander">' +
				'<span class="fc-icon"></span>' +
			'</span>'
		)

		$('<td class="fc-divider" />')
			.attr('colspan', @view.colSpecs.length) # span across all columns
			.append(
				$('<div/>').append(contentEl) # needed by setTrInnerHeight
			)
			.appendTo(tr)

	###
	Renders this row's TR for the quadrant that contains a resource's events
	###
	renderEventContent: (tr) ->
		# insert a single cell, with a single empty <div> (needed by setTrInnerHeight).
		# there will be no content
		tr.append('
			<td class="fc-divider">
				<div/>
			</td>
		')