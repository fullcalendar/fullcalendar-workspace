import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import * as svgIcons from './svgIcons.js'

// Will import ambient types during dev but strip out for build
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timeline'

const buttonIconClass = 'size-5 text-gray-400' // best???

const shadowClass = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1),0_3px_12px_rgba(0,0,0,0.1)]'
const blueGlowClass = '[box-shadow:0_8px_16px_rgba(0,129,255,0.2)]'
const blueGlowSmallClass = '[box-shadow:0_4px_8px_rgba(0,129,255,0.2)]'

const dayGridClasses: CalendarOptions = {
  rowEventClass: (data) => [
    'mb-0.5',
    data.isStart && 'ms-1',
    data.isEnd && 'me-1',
  ],

  listItemEventClass: 'mx-1 p-1 mb-px hover:bg-gray-100 rounded-sm',
  listItemEventInnerClass: 'flex flex-row text-xs',
  listItemEventTimeClass: 'order-1',
  listItemEventTitleClass: 'font-medium flex-grow',

  rowEventTimeClass: 'order-1',
  rowEventTitleClass: 'flex-grow',

  moreLinkClass: 'mx-1 flex flex-row',
  moreLinkInnerClass: `p-1 text-xs font-medium text-white rounded-sm bg-blue-500 ${blueGlowSmallClass}`,
  //^^^ setting that lets you do just "+3"
}

export default createPlugin({
  name: '<%= pkgName %>', // TODO
  optionDefaults: {
    eventColor: '#22CCE2',
    /*
    red: #FF3D57
    green: #09B66D
    primary-blue: #0081FF
    light-blue: #22CCE2
    */
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)',
    eventDisplay: 'block',

    class: 'gap-6',

    viewClass: `bg-white rounded-lg overflow-hidden ${shadowClass}`,

    toolbarClass: 'gap-5 items-center',
    toolbarSectionClass: 'gap-5 items-center',
    toolbarTitleClass: 'text-xl font-bold text-gray-800',

    buttonGroupClass: (data) => [
      `bg-white rounded-sm ${shadowClass}`,
      data.isViewGroup && 'p-[3px]',
    ],

    buttonClass: (data) => [
      'text-sm',
      data.isDisabled ? 'text-gray-400' : 'text-gray-800',
      (!data.isSelected && !data.isDisabled) && 'hover:bg-gray-100',
      (!data.inGroup || data.inViewGroup) && 'rounded-sm', // standalone or in non-selector-group
      (data.inGroup && !data.inViewGroup) && 'first:rounded-s-sm last:rounded-e-sm not-first:border-s not-first:border-s-gray-200', // opposite of ^^^
      !data.inGroup && `bg-gradient-to-b from-white to-gray-50 ${shadowClass}`,
      data.isIconOnly ? 'px-[12px]' : 'px-[16px]',
      data.inViewGroup ? 'py-[7px]' : 'py-[10px]',
      data.isSelected && `bg-[#0081FF] text-white ${blueGlowClass}`,
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

    dayHeaderClass: 'items-center',
    dayHeaderInnerClass: 'p-2',
    dayHeaderContent: (data) => (
      <div className={
        'text-sm py-1 px-3 rounded-md ' +
        (data.isToday
        ? `text-white bg-[#0081FF] ${blueGlowClass}`
        : 'text-gray-500')
      }>
        {data.text}
      </div>
    ),
    dayHeaderDividerClass: 'border-b border-gray-200',

    dayRowClass: 'border border-gray-200',

    dayCellClass: (data) => [
      'border border-gray-200',
      data.isToday && 'bg-[#0081FF]/5',
    ],
    dayCellTopClass: 'flex flex-row justify-end min-h-1',
    dayCellTopInnerClass: (data) => [
      !data.isToday && 'mx-1',
      'p-1 text-sm font-bold',
    ],
    dayCellTopContent: (data) => (
      <Fragment>
        {data.textParts.map((textPart) => (
          textPart.type !== 'day' ? (
            <span className='whitespace-pre'>{textPart.value}</span>
          ) : (
            data.isToday ? (
              <span className={`w-[2em] h-[2em] flex flex-row items-center justify-center whitespace-pre rounded-full bg-[#0081FF] ${blueGlowClass} text-white font-semibold`}>{textPart.value}</span>
            ) : (
              <span className='h-[2em] flex flex-row items-center justify-center whitespace-pre'>{textPart.value}</span>
            )
          )
        ))}
      </Fragment>
    ),

    dayLaneClass: (data) => [
      'border border-gray-200',
      data.isToday && 'bg-[#0081FF]/5',
    ],

    blockEventClass: 'relative bg-(--fc-event-color)',
    blockEventColorClass: 'absolute z-10 inset-0 [box-shadow:0_4px_8px_var(--fc-event-color)] opacity-20',
    blockEventInnerClass: 'relative z-20 text-(--fc-event-contrast-color) text-xs',

    rowEventClass: (data) => [
      data.isStart && 'rounded-s-sm',
      data.isEnd && 'rounded-e-sm',
    ],
    rowEventColorClass: (data) => [
      data.isStart && 'rounded-s-sm',
      data.isEnd && 'rounded-e-sm',
    ],
    rowEventInnerClass: 'flex flex-row',
    rowEventTimeClass: 'p-1',
    rowEventTitleClass: 'p-1 font-medium',
    //^^^for row event, switch order of title/time?

    columnEventClass: (data) => [
      data.isStart && 'rounded-t-lg',
      data.isEnd && 'rounded-b-lg',
    ],
    columnEventColorClass: (data) => [
      data.isStart && 'rounded-t-lg',
      data.isEnd && 'rounded-b-lg',
      (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
    ],
    columnEventInnerClass: 'flex-col py-1',
    // TODO: move the x-padding to the inner div? same concept with row-events
    columnEventTimeClass: 'px-2 pt-1',
    columnEventTitleClass: 'px-2 py-1 font-medium',

    allDayHeaderInnerClass: 'p-2 text-xs text-gray-700',

    allDayDividerClass: 'border-b border-gray-200 shadow-sm',

    slotLabelDividerClass: 'border-s border-gray-200',

    slotLabelClass: 'justify-end',
    slotLabelInnerClass: 'p-2 text-xs text-gray-700',

    slotLaneClass: 'border border-gray-200',

    fillerClass: (data) => [
      !data.isHeader && 'border border-gray-100',
    ],
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

      columnEventClass: (data) => [
        'mx-0.5', // TODO: move this to the columnInner thing? yes!!
        data.isStart && 'mt-0.5',
        data.isEnd && 'mb-0.5',
      ],
    },
    timeline: {
    },
    list: {
    },
  },
}) as PluginDef
