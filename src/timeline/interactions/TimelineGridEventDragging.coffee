
###
TODO: use pubsub instead?
###
class TimelineEventDragging extends EventDragging


	segDragStart: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.forceRelative()


	segDragStop: ->
		super

		if @component.eventTitleFollower
			@component.eventTitleFollower.clearForce()
