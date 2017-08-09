
###
TODO: use pubsub instead?
###
class TimelineGridEventDragging extends EventDragging


	segDragStart: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.forceRelative()


	segDragStop: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.clearForce()
