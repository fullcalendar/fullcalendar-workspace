
###
TODO: use pubsub instead?
###
class TimelineGridEventResizing extends EventResizing


	segResizeStart: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.forceRelative()


	segResizeStop: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.clearForce()
