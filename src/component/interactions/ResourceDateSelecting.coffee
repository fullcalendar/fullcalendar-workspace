
class ResourceDateSelecting extends DateSelecting


	computeSelectionFootprint: (startFootprint, endFootprint) ->

		if not @component.allowCrossResource and startFootprint.resourceId != endFootprint.resourceId
			return

		plainFootprint = super

		new ResourceComponentFootprint(
			plainFootprint.unzonedRange,
			plainFootprint.isAllDay,
			startFootprint.resourceId
		)
