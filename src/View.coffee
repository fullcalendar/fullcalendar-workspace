
class ViewExtension extends View

	isListeningToResources: false


	displayEvents: (events) ->
		@listenToResources() # TODO: not really part of displaying. move elsewhere
		@processLicenseKey(@calendar.options.schedulerLicenseKey) # TODO: not related to events. move elsewhere

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


	# License Key Processing
	# ------------------------------------------------------------------------------------------


	processLicenseKey: (key) ->
		if not key
			@renderingWarning('Please use a valid license key. <a href="">More Info</a>')


	renderingWarning: (htmlMessage) ->
		@el.append(
			$('<div class="fc-license-message" />').html(htmlMessage)
		)


View.prototype = ViewExtension.prototype