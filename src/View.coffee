
class ViewExtension extends View

	isResourceListening: false


	displayEvents: (events) ->
		@listenToResources() # TODO::::::::::::::::::::::::::: make not part of displaying
		@calendar.resourceManager.getResources().then => #::::::: make this assignResources?
			# hack to make sure resources rendered first
			# necessary for color data!!!
			super(events)


	listenToResources: -> # TODO: have instantiateView call this!?
		if not @isResourceListening
			@calendar.resourceManager
				.on 'add', proxy(this, 'addResource') #:::::::::: wait for assignResources?
				.on 'remove', proxy(this, 'removeResource')
				.on 'reset', proxy(this, 'resetResources')
			@isResourceListening = true

		# ACTUALLY: we don't need to wait for assignResources because all this is coming from ResourceManager
		#  when it is done (?) anyway
		# THOUGH, would assignResources have returned yet? (if we are talking about ResourceView)


	addResource: (resource) ->
		@calendar.rerenderEvents() # TODO: shouldn't this be called always?


	removeResource: (resource) ->
		@calendar.rerenderEvents()


	resetResources: (resources) -> # if there's a reset, there should be a set/unset
		@calendar.rerenderEvents()


View.prototype = ViewExtension.prototype