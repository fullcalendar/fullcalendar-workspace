
FC.views.timeline =
	class: TimelineView
	defaults:
		eventResizableFromStart: true

FC.views.timelineDay =
	type: 'timeline'
	duration: { days: 1 }

FC.views.timelineWeek =
	type: 'timeline'
	duration: { weeks: 1 }

FC.views.timelineMonth =
	type: 'timeline'
	duration: { months: 1 }

FC.views.timelineYear =
	type: 'timeline'
	duration: { years: 1 }