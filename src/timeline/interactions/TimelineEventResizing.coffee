
###
TODO: use pubsub instead?
###
class TimelineEventResizing extends EventResizing


	segResizeStart: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.forceRelative()


	segResizeStop: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.clearForce()
