import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgIcons from './ui-default-svgs.js'

const buttonFontClass = 'text-sm'
const buttonIconClass = 'size-[calc(var(--text-sm--line-height)_*_1em)]'

const canvasBgColorClass = 'bg-(--fc-classic-canvas-color)'
const canvasOutlineColorClass = 'outline-(--fc-classic-canvas-color)'

/*
TODO: color variables
*/
export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  borderColorClass: 'border-(--fc-classic-border-color)',
  majorBorderColorClass: 'border-(--fc-classic-major-border-color)',
  alertBorderColorClass: 'border-(--fc-classic-alert-color)',
  alertBorderStartColorClass: 'border-s-(--fc-classic-alert-color)',

  todayBgColorClass: 'bg-(--fc-classic-today-color)',
  highlightBgColorClass: 'bg-(--fc-classic-highlight-color)',

  eventColor: '#3788d8',
  eventContrastColor: 'var(--color-white)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  popoverClass: `border border-(--fc-classic-border-color) ${canvasBgColorClass} shadow-md`,

  canvasBgColorClass,
  canvasOutlineColorClass,
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    toolbarClass: (data) => [
      'items-center gap-3',
      data.borderlessX && 'px-3', // space from edge
    ],
    toolbarSectionClass: (data) => [
      'items-center gap-3',
      data.name === 'center' && '-order-1 sm:order-0 w-full sm:w-auto', // nicer wrapping
    ],
    toolbarTitleClass: 'text-xl md:text-2xl font-bold',

    buttons: {
      prev: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronLeft(buttonIconClass)
          : svgIcons.chevronRight(buttonIconClass),
      },
      next: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronRight(buttonIconClass)
          : svgIcons.chevronLeft(buttonIconClass),
      },
      prevYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsLeft(buttonIconClass)
          : svgIcons.chevronsRight(buttonIconClass),
      },
      nextYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsRight(buttonIconClass)
          : svgIcons.chevronsLeft(buttonIconClass),
      },
    },

    buttonGroupClass: 'items-center isolate',
    buttonClass: (data) => [
      'inline-flex items-center py-2 border-x',
      'focus:outline-3 outline-slate-600/50',
      'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
      'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
      'text-white print:text-black',
      buttonFontClass,
      data.isIconOnly ? 'px-2.5' : 'px-3',
      data.inGroup
        ? 'first:rounded-s-[4px] last:rounded-e-[4px] relative active:z-20 focus:z-20'
        : 'rounded-[4px]',
      data.isSelected // implies inGroup
        ? 'z-10 border-slate-900 bg-slate-800'
        : 'z-0 border-transparent bg-slate-700',
      data.isDisabled
        && 'opacity-65 pointer-events-none', // bypass hover styles
    ],

    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
  },
  views: baseEventCalendarOptions.views,
}
