
class ResourceEventResizing extends EventResizing


	computeEventStartResizeMutation: (startFootprint, endFootprint, eventDef) ->

		if not @component.allowCrossResource and startFootprint.resourceId != endFootprint.resourceId
			return

		super


	computeEventEndResizeMutation: (startFootprint, endFootprint, eventDef) ->

		if not @component.allowCrossResource and startFootprint.resourceId != endFootprint.resourceId
			return

		super
