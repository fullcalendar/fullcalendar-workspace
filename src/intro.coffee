###!
<%= title %> v<%= version %>
###

`(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'jquery', 'moment' ], factory);
	}
	else {
		factory(jQuery, moment);
	}
})(function($, moment) {`

FC = $.fullCalendar
Calendar = FC.Calendar
Class = FC.Class
View = FC.View
Grid = FC.Grid
intersectionToSeg = FC.intersectionToSeg
compareSegs = FC.compareSegs
debounce = FC.debounce
isInt = FC.isInt
getScrollbarWidths = FC.getScrollbarWidths
DragListener = FC.DragListener
htmlEscape = FC.htmlEscape
computeIntervalUnit = FC.computeIntervalUnit
proxy = FC.proxy
capitaliseFirstLetter = FC.capitaliseFirstLetter
applyAll = FC.applyAll