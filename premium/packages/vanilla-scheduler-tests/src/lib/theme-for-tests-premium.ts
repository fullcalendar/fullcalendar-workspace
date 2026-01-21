import { PluginDef, createPlugin, joinClassNames } from '@fullcalendar/core'
import { getDayClass } from '@fullcalendar-tests/standard/lib/theme-for-tests'

export default createPlugin({
  name: 'theme-for-tests-premium',
  optionDefaults: {
    resourceDayHeaderClass: (data) => joinClassNames(
      'fc-resource',
      getDayClass(data),
    ),
    dayHeaderClass: (data) => joinClassNames(
      data.resource && 'fc-resource',
    ),
    dayCellClass: (data) => joinClassNames(
      data.resource && 'fc-resource',
    ),
    resourceColumnResizerClass: 'fc-datagrid-col-resizer',
    resourceCellClass: 'fc-cell fc-resource',
    resourceCellInnerClass: 'fc-cell-main',
    resourceIndentClass: 'fc-resource-indent',
    resourceExpanderClass: (data) => joinClassNames(
      'fc-resource-expander',
      data.isExpanded
        ? 'fc-resource-expander-expanded'
        : 'fc-resource-expander-collapsed',
    ),
    resourceLaneClass: 'fc-timeline-lane fc-resource',
    resourceGroupHeaderClass: 'fc-resource-group',
    resourceGroupHeaderInnerClass: 'fc-resource-group-inner',
    resourceGroupLaneClass: 'fc-timeline-lane fc-resource-group',
    resourceColumnDividerClass: 'fc-datagrid-divider',
  },
  views: {
    timeline: {
      viewClass: 'fc-timeline',
      tableHeaderClass: 'fc-timeline-header', // will apply to datagrid too
      tableBodyClass: 'fc-timeline-body', // will apply to datagrid too
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
