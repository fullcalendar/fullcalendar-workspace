import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'

// Will import ambient types during dev but strip out for build
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timeline'

const buttonIconClass = 'size-5 text-gray-400' // best???

const dayGridClasses: CalendarOptions = {
}

export default createPlugin({
  name: '<%= pkgName %>', // TODO
  optionDefaults: {
    // eventColor: '#3788d8',
    // eventContrastColor: 'var(--color-white)',
    // backgroundEventColor: 'var(--color-green-500)',

    class: 'gap-6',

    viewClass: 'bg-white rounded-lg shadow-lg overflow-hidden',

    toolbarClass: 'gap-5 items-center',
    toolbarSectionClass: 'gap-5 items-center',
    toolbarTitleClass: 'text-xl font-bold text-gray-800',

    buttonGroupClass: (data) => [
      'bg-white rounded-sm shadow-md',
      data.isViewGroup && 'p-[3px]',
    ],

    buttonClass: (data) => [
      'text-[15px]/5',
      data.isDisabled ? 'text-gray-400' : 'text-gray-800',
      (!data.isSelected && !data.isDisabled) && 'hover:bg-gray-100',
      (!data.inGroup || data.inViewGroup) && 'rounded-sm', // standalone or in non-selector-group
      (data.inGroup && !data.inViewGroup) && 'first:rounded-s-sm last:rounded-e-sm not-first:border-s not-first:border-s-gray-200', // opposite of ^^^
      !data.inGroup && 'bg-white shadow-md',
      data.isIconOnly ? 'px-[12px]' : 'px-[16px]',
      data.inViewGroup ? 'py-[7px]' : 'py-[10px]',
      data.isSelected && 'bg-[#0081FF] text-white',
    ],

    buttons: {
      // TODO: RTL
      prev: {
        iconContent: () => svgIcons.chevronLeft(buttonIconClass),
      },
      next: {
        iconContent: () => svgIcons.chevronRight(buttonIconClass),
      },
    },


  },
  views: {
    dayGrid: {
      ...dayGridClasses,
    },
    multiMonth: {
      ...dayGridClasses,
    },
    timeGrid: {
      ...dayGridClasses,
    },
    timeline: {
    },
    list: {
    },
  },
}) as PluginDef
