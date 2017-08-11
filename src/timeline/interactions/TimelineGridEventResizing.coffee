
###
TODO: use pubsub instead?
###
class TimelineGridEventResizing extends EventResizing


	segResizeStart: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.forceRelative()


	segResizeStop: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.clearForce()
