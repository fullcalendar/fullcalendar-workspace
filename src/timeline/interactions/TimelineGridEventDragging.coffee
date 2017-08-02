
###
TODO: use pubsub instead?
###
class TimelineGridEventDragging extends EventDragging


	segDragStart: ->
		super

		if @component.eventRenderer.eventTitleFollower
			@component.eventRenderer.eventTitleFollower.forceRelative()


	segDragStop: ->
		super

		if @component.eventRenderer.eventTitleFollower
			@component.eventRenderer.eventTitleFollower.clearForce()
