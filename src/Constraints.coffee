
Constraints_getPeerEventInstances = Constraints::getPeerEventInstances
Constraints_isFootprintAllowed = Constraints::isFootprintAllowed
Constraints_buildCurrentBusinessFootprints = Constraints::buildCurrentBusinessFootprints
Constraints_footprintContainsFootprint = Constraints::footprintContainsFootprint
Constraints_footprintsIntersect = Constraints::footprintsIntersect
Constraints_eventRangeToEventFootprints = Constraints::eventRangeToEventFootprints
Constraints_parseFootprints = Constraints::parseFootprints


Constraints::getPeerEventInstances = (subjectEventDef) ->
	subjectResourceIds = subjectEventDef.getResourceIds()
	peerInstances = Constraints_getPeerEventInstances.apply(this, arguments)

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
Constraints::isFootprintAllowed = (footprint, peerEventFootprints, constraintVal, overlapVal, subjectEventInstance) ->
	if typeof constraintVal == 'object'

		constrainToResourceIds = Resource.extractIds(constraintVal, this)

		if constrainToResourceIds.length and (
			not (footprint instanceof ResourceComponentFootprint) or
			not (footprint.resourceId in constrainToResourceIds)
		)
			return false

	Constraints_isFootprintAllowed.apply(this, arguments)


Constraints::buildCurrentBusinessFootprints = (isAllDay) ->
	flatResources = @_calendar.resourceManager.getFlatResources()
	anyCustomBusinessHours = false

	# any per-resource business hours? or will one global businessHours suffice?
	for resource in flatResources
		if resource.businessHourGenerator
			anyCustomBusinessHours = true

	# if there are any custom business hours, all business hours must be sliced per-resources
	if anyCustomBusinessHours
		view = @view
		generalBusinessHourGenerator = view.get('businessHourGenerator')
		unzonedRange = view.dateProfile.activeUnzonedRange
		componentFootprints = []

		for resource in flatResources
			businessHourGenerator = resource.businessHourGenerator or generalBusinessHourGenerator
			eventInstanceGroup = businessHourGenerator.buildEventInstanceGroup(isAllDay, unzonedRange)

			if eventInstanceGroup
				for eventRange in eventInstanceGroup.getAllEventRanges()
					componentFootprints.push(
						new ResourceComponentFootprint(
							eventRange.unzonedRange
							isAllDay # isAllDay
							resource.id
						)
					)

		componentFootprints
	else
		Constraints_buildCurrentBusinessFootprints.apply(this, arguments)


Constraints::footprintContainsFootprint = (outerFootprint, innerFootprint) ->
	if outerFootprint instanceof ResourceComponentFootprint and
			(not (innerFootprint instanceof ResourceComponentFootprint) or
			 innerFootprint.resourceId != outerFootprint.resourceId)
		return false

	Constraints_footprintContainsFootprint.apply(this, arguments)


Constraints::footprintsIntersect = (footprint0, footprint1) ->
	if footprint0 instanceof ResourceComponentFootprint and
			footprint1 instanceof ResourceComponentFootprint and
			footprint0.resourceId != footprint1.resourceId
		return false

	Constraints_footprintsIntersect.apply(this, arguments)


###
TODO: somehow more DRY with DateComponent::eventRangeToEventFootprints monkeypatch
###
Constraints::eventRangeToEventFootprints = (eventRange) ->
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
		Constraints_eventRangeToEventFootprints.apply(this, arguments)


Constraints::parseFootprints = (input) ->
	plainFootprints = Constraints_parseFootprints.apply(this, arguments)
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
