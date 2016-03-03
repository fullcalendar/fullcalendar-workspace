
module.exports =

	scripts: [
		'intro.coffee'

		'util/util.coffee'
		'util/EnhancedScroller.coffee'
		'util/ClippedScroller.coffee'
		'util/ScrollerCanvas.coffee'
		'util/ScrollJoiner.coffee'
		'util/ScrollFollower.coffee'
		'util/ScrollFollowerSprite.coffee'

		'Calendar.coffee'
		'View.coffee'
		'Grid.coffee'

		'ResourceManager.coffee'
		'ResourceViewMixin.coffee'
		'ResourceGridMixin.coffee'

		'common/ResourceDayTableMixin.coffee'
		'common/ResourceDayGrid.coffee'
		'common/ResourceTimeGrid.coffee'

		'timeline/TimelineView.coffee'
		'timeline/TimelineGrid.coffee'
		'timeline/TimelineGrid.defaults.coffee'
		'timeline/config.coffee'

		'resource-timeline/ResourceTimelineView.coffee'
		'resource-timeline/ResourceTimelineGrid.coffee'
		'resource-timeline/Spreadsheet.coffee'
		'resource-timeline/RowParent.coffee'
		'resource-timeline/RowGroup.coffee'
		'resource-timeline/HRowGroup.coffee'
		'resource-timeline/VRowGroup.coffee'
		'resource-timeline/EventRow.coffee'
		'resource-timeline/ResourceRow.coffee'
		'resource-timeline/config.coffee'

		'resource-agenda/ResourceAgendaView.coffee'
		'resource-agenda/config.coffee'

		'resource-basic/ResourceBasicView.coffee'
		'resource-basic/ResourceMonthView.coffee'
		'resource-basic/config.coffee'

		'license.coffee'
		'outro.coffee'
	]

	stylesheets: [
		'timeline/timeline.css'
	]
