###!
<%= title %> v<%= version %>
Docs & License: <%= homepage %>
(c) <%= copyright %>
###

`(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'jquery', 'moment', 'fullcalendar' ], factory);
	}
	else if (typeof exports === 'object') { // Node/CommonJS
		module.exports = factory(
			require('jquery'),
			require('moment'),
			require('fullcalendar')
		);
	}
	else {
		factory(jQuery, moment);
	}
})(function($, moment) {`

FC = $.fullCalendar
FC.schedulerVersion = "<%= version %>"

# When the required internal version is upped,
# also update the .json files with a new minor version requirement.
# Example: bump ~2.7.2 to ~2.8.0
# Use a tilde to match future patch-level changes only!
if FC.internalApiVersion != 9
	FC.warn(
		'v' + FC.schedulerVersion + ' of FullCalendar Scheduler ' +
		'is incompatible with v' + FC.version + ' of the core.\n' +
		'Please see http://fullcalendar.io/support/ for more information.'
	)
	return # stop execution. don't load the plugin

Calendar = FC.Calendar
Class = FC.Class
View = FC.View
Grid = FC.Grid
debounce = FC.debounce
isInt = FC.isInt
removeExact = FC.removeExact
getScrollbarWidths = FC.getScrollbarWidths
DragListener = FC.DragListener
htmlEscape = FC.htmlEscape
computeGreatestUnit = FC.computeGreatestUnit
proxy = FC.proxy
capitaliseFirstLetter = FC.capitaliseFirstLetter
applyAll = FC.applyAll
EmitterMixin = FC.EmitterMixin
ListenerMixin = FC.ListenerMixin
durationHasTime = FC.durationHasTime
divideRangeByDuration = FC.divideRangeByDuration
divideDurationByDuration = FC.divideDurationByDuration
multiplyDuration = FC.multiplyDuration
parseFieldSpecs = FC.parseFieldSpecs
compareByFieldSpecs = FC.compareByFieldSpecs
flexibleCompare = FC.flexibleCompare
intersectRects = FC.intersectRects
CoordCache = FC.CoordCache
getContentRect = FC.getContentRect
getOuterRect = FC.getOuterRect
Promise = FC.Promise
TaskQueue = FC.TaskQueue
UnzonedRange = FC.UnzonedRange
ComponentFootprint = FC.ComponentFootprint
EventDef = FC.EventDef
EventSource = FC.EventSource
EventFootprint = FC.EventFootprint
EventDefMutation = FC.EventDefMutation
