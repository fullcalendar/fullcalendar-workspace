
var FC = $.fullCalendar;
FC.schedulerVersion = "<%= version %>";

/*
When the required internal version is upped,
also update the .json files with a new minor version requirement.
Example: bump ~2.7.2 to ~2.8.0
Use a tilde to match future patch-level changes only!
*/
if (FC.internalApiVersion !== 11) {
	FC.warn(
		'v' + FC.schedulerVersion + ' of FullCalendar Scheduler ' +
		'is incompatible with v' + FC.version + ' of the core.\n' +
		'Please see http://fullcalendar.io/support/ for more information.'
	);
	return; // stop execution. don't load the plugin
}

var Calendar = FC.Calendar;
var Constraints = FC.Constraints;
var Class = FC.Class;
var Mixin = FC.Mixin;
var View = FC.View;
var debounce = FC.debounce;
var isInt = FC.isInt;
var removeExact = FC.removeExact;
var getScrollbarWidths = FC.getScrollbarWidths;
var DragListener = FC.DragListener;
var htmlEscape = FC.htmlEscape;
var computeGreatestUnit = FC.computeGreatestUnit;
var proxy = FC.proxy;
var capitaliseFirstLetter = FC.capitaliseFirstLetter;
var applyAll = FC.applyAll;
var EmitterMixin = FC.EmitterMixin;
var ListenerMixin = FC.ListenerMixin;
var durationHasTime = FC.durationHasTime;
var divideRangeByDuration = FC.divideRangeByDuration;
var divideDurationByDuration = FC.divideDurationByDuration;
var multiplyDuration = FC.multiplyDuration;
var parseFieldSpecs = FC.parseFieldSpecs;
var compareByFieldSpecs = FC.compareByFieldSpecs;
var flexibleCompare = FC.flexibleCompare;
var intersectRects = FC.intersectRects;
var CoordCache = FC.CoordCache;
var getContentRect = FC.getContentRect;
var getOuterRect = FC.getOuterRect;
var Promise = FC.Promise;
var TaskQueue = FC.TaskQueue;
var UnzonedRange = FC.UnzonedRange;
var ComponentFootprint = FC.ComponentFootprint;
var EventDef = FC.EventDef;
var EventSource = FC.EventSource;
var EventFootprint = FC.EventFootprint;
var EventDefMutation = FC.EventDefMutation;
var cssToStr = FC.cssToStr;
var DateComponent = FC.DateComponent;
var InteractiveDateComponent = FC.InteractiveDateComponent;
var EventRenderer = FC.EventRenderer;
var BusinessHourRenderer = FC.BusinessHourRenderer;
var FillRenderer = FC.FillRenderer;
var HelperRenderer = FC.HelperRenderer;
var StandardInteractionsMixin = FC.StandardInteractionsMixin;
var DateSelecting = FC.DateSelecting;
var EventPointing = FC.EventPointing;
var EventDragging = FC.EventDragging;
var EventResizing = FC.EventResizing;
var ExternalDropping = FC.ExternalDropping;
var BusinessHourGenerator = FC.BusinessHourGenerator;
var EventInstanceGroup = FC.EventInstanceGroup;
