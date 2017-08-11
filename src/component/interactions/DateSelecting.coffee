
# references to pre-monkeypatched methods
DateSelecting_computeSelectionFootprint = DateSelecting::computeSelectionFootprint


DateSelecting::computeSelectionFootprint = (startFootprint, endFootprint) ->
	
	if startFootprint.resourceId and endFootprint.resourceId and
			startFootprint.resourceId != endFootprint.resourceId and
			not @component.allowCrossResource

		null # explicity disallow selection across two different resources
	else
		footprint = DateSelecting_computeSelectionFootprint.apply(this, arguments)

		if startFootprint.resourceId
			# create a new footprint with resourceId data
			footprint = new ResourceComponentFootprint(
				footprint.unzonedRange,
				footprint.isAllDay,
				startFootprint.resourceId
			)

		footprint
