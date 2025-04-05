import { createPlugin, PluginDef } from '@fullcalendar/core'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: ['fc', 'fc-theme-standard'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    viewClassNames: (view) => ['fc-view', `fc-${view.type}-view`, 'fc-border'],
    popoverClassNames: 'fc-popover',
    popoverHeaderClassNames: 'fc-popover-header',
    popoverBodyClassNames: 'fc-popover-body',
  },
  views: {
    dayGrid: {
      viewClassNames: 'fc-daygrid',
    },
    timeGrid: {
      viewClassNames: 'fc-timegrid',
    },
    list: {
      viewClassNames: 'fc-list',
    },
    multiMonth: {
      viewClassNames: 'fc-multimonth',
    },
    timeline: {
      viewClassNames: 'fc-timeline',
    },
    resourceDayGrid: {
      viewClassNames: 'fc-resource-daygrid', // also inherits dayGrid
    },
    resourceTimeGrid: {
      viewClassNames: 'fc-resource-timegrid', // also inherits timeGrid
    },
    resourceTimeline: {
      viewClassNames: 'fc-resource-timeline',
    },
  },
}) as PluginDef
