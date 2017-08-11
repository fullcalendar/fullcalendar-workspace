
###
TODO: use pubsub instead?
###
class TimelineGridEventDragging extends EventDragging


	segDragStart: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.forceRelative()


	segDragStop: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.clearForce()
