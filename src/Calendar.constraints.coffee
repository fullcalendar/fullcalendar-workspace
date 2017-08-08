
CalendarExtension::getPeerEventInstances = (subjectEventDef) ->
	subjectResourceIds = subjectEventDef.getResourceIds()
	peerInstances = super

	if not subjectResourceIds.length
		peerInstances
	else
		peerInstances.filter (peerInstance) ->

			# always consider non-resource events to be peers
			if not peerInstance.def.resourceIds.length
				return true

			# has same resource? consider it a peer
			for resourceId in subjectResourceIds
				if peerInstance.def.hasResourceId(resourceId)
					return true

			false


# enforce resource ID constraint
CalendarExtension::isFootprintAllowed = (footprint, peerEventFootprints, constraintVal, overlapVal, subjectEventInstance) ->
	if typeof constraintVal == 'object'

		constrainToResourceIds = Resource.extractIds(constraintVal, this)

		if constrainToResourceIds.length and (
			not (footprint instanceof ResourceComponentFootprint) or
			not (footprint.resourceId in constrainToResourceIds)
		)
			return false

	super


CalendarExtension::buildCurrentBusinessFootprints = (wholeDay) ->
	flatResources = @resourceManager.getFlatResources()
	anyCustomBusinessHours = false

	# any per-resource business hours? or will one global businessHours suffice?
	for resource in flatResources
		if resource.businessHours
			anyCustomBusinessHours = true

	# if there are any custom business hours, all business hours must be sliced per-resources
	if anyCustomBusinessHours
		footprints = []

		for resource in flatResources
			plainFootprints = @_buildCurrentBusinessFootprints(
				wholeDay
				resource.businessHours or @opt('businessHours')
			)

			for plainFootprint in plainFootprints
				footprints.push(
					new ResourceComponentFootprint(
						plainFootprint.unzonedRange,
						plainFootprint.isAllDay,
						resource.id
					)
				)

		footprints
	else
		super(wholeDay)


CalendarExtension::footprintContainsFootprint = (outerFootprint, innerFootprint) ->
	if outerFootprint instanceof ResourceComponentFootprint and
			(not (innerFootprint instanceof ResourceComponentFootprint) or
			 innerFootprint.resourceId != outerFootprint.resourceId)
		return false
	super


CalendarExtension::footprintsIntersect = (footprint0, footprint1) ->
	if footprint0 instanceof ResourceComponentFootprint and
			footprint1 instanceof ResourceComponentFootprint and
			footprint0.resourceId != footprint1.resourceId
		return false
	super


###
TODO: somehow more DRY with ResourceComponentMixin.eventRangeToEventFootprints
###
CalendarExtension::eventRangeToEventFootprints = (eventRange) ->
	eventDef = eventRange.eventDef
	resourceIds = eventDef.getResourceIds()

	if resourceIds.length
		for resourceId in resourceIds # returns the accumulation
			new EventFootprint(
				new ResourceComponentFootprint(
					eventRange.unzonedRange
					eventDef.isAllDay()
					resourceId
				)
				eventDef
				eventRange.eventInstance # might not exist
			)
	else
		super


CalendarExtension::parseFootprints = (input) ->
	plainFootprints = super
	resourceIds = input.resourceIds or []

	if input.resourceId
		resourceIds = [ input.resourceId ].concat(resourceIds)

	if resourceIds.length
		footprints = []

		for resourceId in resourceIds
			for plainFootprint in plainFootprints
				footprints.push(
					new ResourceComponentFootprint(
						plainFootprint.unzonedRange
						plainFootprint.isAllDay
						resourceId
					)
				)

		footprints
	else
		plainFootprints
