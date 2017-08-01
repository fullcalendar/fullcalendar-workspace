
###
TODO: use pubsub instead?
###
class TimelineGridEventResizing extends EventResizing


	segResizeStart: ->
		super

		if @component.eventRenderer.eventTitleFollower
			@component.eventRenderer.eventTitleFollower.forceRelative()


	segResizeStop: ->
		super

		if @component.eventRenderer.eventTitleFollower
			@component.eventRenderer.eventTitleFollower.clearForce()
