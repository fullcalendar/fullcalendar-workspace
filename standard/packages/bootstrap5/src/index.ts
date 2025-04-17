import { createPlugin, PluginDef } from '@fullcalendar/core'
import { BootstrapTheme } from './BootstrapTheme.js'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  themeClasses: {
    bootstrap5: BootstrapTheme,
  },
  optionDefaults: {
    classNames: ['fc', 'fc-theme-bootstrap5'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    viewClassNames: (arg) => ['fc-view', `fc-${arg.view.type}-view`, 'fc-border'],
    popoverClassNames: ['fc-popover', 'popover'],
    popoverHeaderClassNames: ['fc-popover-header', 'popover-header'],
    popoverBodyClassNames: ['fc-popover-body', 'popover-body'],
    buttonGroupClassNames: 'btn-group',
    buttonClassNames: (arg) => [
      'btn',
      'btn-primary',
      arg.isSelected && 'active',
    ],
    iconClassNames: 'bi',
    icons: {
      close: { classNames: 'bi-x-lg' },
      prev: { classNames: (arg) => `bi-chevron-${startSide(arg.direction)}` },
      next: { classNames: (arg) => `bi-chevron-${endSide(arg.direction)}` },
      prevYear: { classNames: (arg) => `bi-chevron-double-${startSide(arg.direction)}` },
      nextYear: { classNames: (arg) => `bi-chevron-double-${endSide(arg.direction)}` },
    },
    dayNarrowWidth: 70,
    dayNarrowClassNames: 'fc-day-narrow',
    dayNotNarrowClassNames: 'fc-day-not-narrow',
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


function startSide(direction: 'ltr' | 'rtl'): string {
  return direction === 'ltr' ? 'left' : 'right'
}

function endSide(direction: 'ltr' | 'rtl'): string {
  return direction === 'ltr' ? 'right' : 'left'
}
