
class Emitter

	callbackHash: null


	on: (name, callback) ->
		@getCallbacks(name).add(callback)
		this


	off: (name, callback) ->
		@getCallbacks(name).remove(callback)
		this


	trigger: (name, args...) ->
		@getCallbacks(name).fire(args...)
		this


	getCallbacks: (name) ->
		@callbackHash or= {}
		@callbackHash[name] or= $.Callbacks()