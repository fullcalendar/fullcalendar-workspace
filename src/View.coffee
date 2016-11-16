
# We need to monkey patch these methods in, because subclasses of View might have already been made

origSetElement = View::setElement
origRemoveElement = View::removeElement


View::isResourcesBound = false


View::setElement = ->
	promise = origSetElement.apply(this, arguments)
	@bindResources() # wait until after skeleton
	promise


View::removeElement = ->
	@unbindResources(true) # isDestroying=true
	origRemoveElement.apply(this, arguments)


View::triggerDateRender = ->
	processLicenseKey(
		@calendar.options.schedulerLicenseKey
		@el # container element
	)
	@triggerRender()


View::resolveEventRenderDeps = ->
	@requestResources() # because event rendering assumes this data


View::bindResources = ->
	if not @isResourcesBound
		@isResourcesBound = true
		@requestResources().then (resources) =>
			if @isResourcesBound # hasn't been unbound in the meantime
				@listenTo @calendar.resourceManager,
					set: @setResources
					unset: @unsetResources
					reset: @resetResources
					add: @addResource
					remove: @removeResource
				@setResources(resources)


View::unbindResources = (isDestroying) ->
	if @isResourcesBound
		@isResourcesBound = false
		@stopListeningTo(@calendar.resourceManager)
		@unsetResources(isDestroying)


View::requestResources = ->
	@calendar.resourceManager.getResources()


View::setResources = (resources) ->
	if @isEventsSet
		@resetEvents()


View::unsetResources = (isDestroying) ->
	if not isDestroying and @isEventsSet
		@resetEvents()


View::resetResources = (resources) ->
	if @isEventsSet
		@resetEvents()


View::addResource = ->
	if @isEventsSet
		@resetEvents()


View::removeResource = ->
	if @isEventsSet
		@resetEvents()
