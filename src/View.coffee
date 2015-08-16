
# We need to monkey patch these methods in, because subclasses of View might have already been made

superDisplayEvents = View::displayEvents

View::displayEvents = (events) ->

	# TODO: not really part of displaying. move elsewhere.
	@listenToResources()

	# TODO: not related to events. move elsewhere.
	# but needs to be after the view has rendered.
	processLicenseKey(
		@calendar.options.schedulerLicenseKey,
		@el # container element
	)

	@calendar.resourceManager.getResources().then =>
		# hack to make sure resources are received first (for event color data)
		superDisplayEvents.call(this, events)


View::isListeningToResources = false

View::listenToResources = ->
	if not @isListeningToResources
		@calendar.resourceManager
			.on 'add', proxy(this, 'addResource')
			.on 'remove', proxy(this, 'removeResource')
			.on 'reset', proxy(this, 'resetResources')
		@isListeningToResources = true


# Default Rendering of Resources
# ------------------------------------------------------------------------------------------
# Do these actions for Views that don't explicitly support resources.
# Need to rerender all events because resources dictate event color.


View::addResource = (resource) ->
	@calendar.rerenderEvents()


View::removeResource = (resource) ->
	@calendar.rerenderEvents()


View::resetResources = (resources) ->
	@calendar.rerenderEvents()
