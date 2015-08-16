
class ViewExtension extends View

	isListeningToResources: false


	displayEvents: (events) ->
		@listenToResources() # TODO: not really part of displaying. move elsewhere
		@calendar.resourceManager.getResources().then =>
			# hack to make sure resources are received first (for event color data)
			super(events)


	listenToResources: ->
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


	addResource: (resource) ->
		@calendar.rerenderEvents()


	removeResource: (resource) ->
		@calendar.rerenderEvents()


	resetResources: (resources) ->
		@calendar.rerenderEvents()


View.prototype = ViewExtension.prototype