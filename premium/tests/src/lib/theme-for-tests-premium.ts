import { createPlugin, PluginDef } from '@fullcalendar/core'

export default createPlugin({
  name: 'theme-for-tests-premium',
  optionDefaults: {
    resourceColumnResizerClass: 'fc-datagrid-col-resizer',
    resourceCellClass: 'fc-cell',
    resourceCellInnerClass: 'fc-cell-main',
    resourceIndentClass: 'fc-resource-indent',
    resourceExpanderClass: (data) => [
      'fc-resource-expander',
      data.isExpanded
        ? 'fc-resource-expander-expanded'
        : 'fc-resource-expander-collapsed',
    ],
    resourceLaneClass: 'fc-timeline-lane',
  },
  views: {
    timeline: {
      viewClass: 'fc-timeline',
      tableHeaderClass: 'fc-timeline-header',
      tableBodyClass: 'fc-timeline-body',
      rowEventClass: 'fc-timeline-event',
      moreLinkClass: 'fc-timeline-more-link',
      slotHeaderClass: 'fc-timeline-slot-label',
      slotLaneClass: 'fc-timeline-slot-lane',
      nowIndicatorHeaderClass: 'fc-timeline-now-indicator-arrow',
      nowIndicatorLineClass: 'fc-timeline-now-indicator-line',
    },
    resourceTimeline: {
      viewClass: 'fc-resource-timeline',
    },
    resourceTimeGrid: {
      viewClass: 'fc-resource-timegrid',
    },
    resourceDayGrid: {
      viewClass: 'fc-resource-daygrid',
    },
  }
}) as PluginDef
