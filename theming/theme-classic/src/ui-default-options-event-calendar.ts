import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const bgColorClass = 'bg-(--fc-classic-canvas-color)'
const bgColorOutlineClass = 'outline-(--fc-classic-canvas-color)'

const buttonFontClass = 'text-sm'
const smIconSizeClass = 'size-[calc(var(--text-sm--line-height)_*_1em)]'
const getButtonIconClass = (flip?: boolean) => joinClassNames(
  smIconSizeClass,
  flip && 'rotate-180',
)

export const optionParams: EventCalendarOptionParams = {
  borderColorClass: 'border-(--fc-classic-border-color)',
  nowIndicatorBorderColorClass: 'border-(--fc-classic-now-indicator-color)',
  nowIndicatorBorderStartColorClass: 'border-s-(--fc-classic-now-indicator-color)',
  nowIndicatorBorderTopColorClass: 'border-t-(--fc-classic-now-indicator-color)',
  compactMoreLinkBorderColorClass: 'border-[#3788d8]',
  todayBgClass: 'bg-(--fc-classic-today-color)',
  highlightClass: 'bg-(--fc-classic-highlight-color)',
  transparentMutedBgClass: 'bg-(--fc-classic-muted-transparent-color)',
  opaqueMutedBgClass: 'bg-(--fc-classic-muted-opaque-color)',
  mutedBgClass: 'bg-(--fc-classic-muted-transparent-color)',
  eventColor: '#3788d8',
  eventContrastColor: 'var(--color-white)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'opacity-15',
  popoverClass: `border border-(--fc-classic-border-color) ${bgColorClass} shadow-md`,
  bgColorClass,
  bgColorOutlineClass,
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: 'gap-5',

    toolbarClass: (data) => [
      'items-center gap-3',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-xl md:text-2xl font-bold',

    buttons: {
      prev: {
        iconContent: (data) => svgs.chevronLeft(getButtonIconClass(data.direction === 'rtl')),
      },
      next: {
        iconContent: (data) => svgs.chevronLeft(getButtonIconClass(data.direction !== 'rtl')),
      },
      prevYear: {
        iconContent: (data) => svgs.chevronsLeft(getButtonIconClass(data.direction === 'rtl')),
      },
      nextYear: {
        iconContent: (data) => svgs.chevronsLeft(getButtonIconClass(data.direction !== 'rtl')),
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

    popoverCloseContent: () => svgs.x(`text-sm ${smIconSizeClass}`),
  },
  views: baseEventCalendarOptions.views,
}
