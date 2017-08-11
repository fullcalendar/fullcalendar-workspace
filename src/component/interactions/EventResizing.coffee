
# references to pre-monkeypatched methods
EventResizing_computeEventStartResizeMutation = EventResizing::computeEventStartResizeMutation
EventResizing_computeEventEndResizeMutation = EventResizing::computeEventEndResizeMutation


EventResizing::computeEventStartResizeMutation = (startFootprint, endFootprint, eventDef) ->

	if startFootprint.resourceId and endFootprint.resourceId and
			startFootprint.resourceId != endFootprint.resourceId and
			not @component.allowCrossResource

		null # explicity disallow resizing across two different resources
	else
		EventResizing_computeEventStartResizeMutation.apply(this, arguments)


EventResizing::computeEventEndResizeMutation = (startFootprint, endFootprint, eventDef) ->

	if startFootprint.resourceId and endFootprint.resourceId and
			startFootprint.resourceId != endFootprint.resourceId and
			not @component.allowCrossResource

		null # explicity disallow resizing across two different resources
	else
		EventResizing_computeEventEndResizeMutation.apply(this, arguments)
