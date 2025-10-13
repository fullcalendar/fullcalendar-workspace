import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const bgClass = 'bg-(--fc-classic-background)' // TODO: make this a variable for all themes?
const bgRingColorClass = 'ring-(--fc-classic-background)'

const primaryOutlineColorClass = 'outline-(--fc-classic-primary)'
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'

const ghostHoverClass = 'hover:bg-(--fc-classic-muted)'
const ghostPressableClass = `${ghostHoverClass} active:bg-(--fc-classic-strong) focus-visible:bg-(--fc-classic-muted)`

const faintHoverClass = 'hover:bg-(--fc-classic-faint)'
const faintPressableClass = `${faintHoverClass} active:bg-(--fc-classic-muted) focus-visible:bg-(--fc-classic-faint)`

const buttonIconClass = 'size-5'

export const optionParams: EventCalendarOptionParams = {
  ghostHoverClass,
  ghostPressableClass,

  faintHoverClass,
  faintPressableClass,

  strongSolidPressableClass: '[background:linear-gradient(var(--fc-classic-strong),var(--fc-classic-strong))_var(--fc-classic-background)]',

  primaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineOffsetClass,
  outlineInsetClass,

  mutedBgClass: 'bg-(--fc-classic-muted)',
  mutedSolidBgClass: '[background:linear-gradient(var(--fc-classic-muted),var(--fc-classic-muted))_var(--fc-classic-background)]',
  faintBgClass: 'bg-(--fc-classic-faint)',
  highlightClass: 'bg-(--fc-classic-highlight)',
  todayBgNotPrintClass: 'not-print:bg-(--fc-classic-today)',

  borderColorClass: 'border-(--fc-classic-border)',
  primaryBorderColorClass: 'border-(--fc-classic-primary)',
  strongBorderColorClass: 'border-(--fc-classic-strong-border)',
  nowBorderColorClass: 'border-(--fc-classic-now)',
  nowBorderStartColorClass: 'border-s-(--fc-classic-now)',
  nowBorderTopColorClass: 'border-t-(--fc-classic-now)',

  eventColor: 'var(--fc-classic-primary)',
  eventContrastColor: 'var(--fc-classic-primary-foreground)',
  bgEventColor: 'var(--color-green-500)', // TODO: put as css var
  bgEventColorClass: 'opacity-15',

  popoverClass: `border border-(--fc-classic-border) ${bgClass} shadow-md`,

  bgClass,
  bgRingColorClass,

  mutedFgClass: 'text-(--fc-classic-muted-foreground)',
  faintFgClass: 'text-(--fc-classic-faint-foreground)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: 'gap-5',
    viewClass: `border ${optionParams.borderColorClass} ${optionParams.bgClass}`,

    toolbarClass: (data) => [
      'items-center gap-3',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-2xl font-bold',

    buttonGroupClass: 'items-center isolate',
    buttonClass: (data) => [
      'inline-flex items-center py-2 border-x',
      'focus-visible:outline-3 outline-slate-600/50',
      'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
      'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
      'text-sm text-white print:text-black',
      data.isIconOnly ? 'px-2.5' : 'px-3',
      data.inGroup
        ? 'first:rounded-s-[4px] last:rounded-e-[4px] relative active:z-20 focus-visible:z-20'
        : 'rounded-[4px]',
      data.isSelected // implies inGroup
        ? 'z-10 border-slate-900 bg-slate-800'
        : 'z-0 border-transparent bg-slate-700',
      data.isDisabled
        && 'opacity-65 pointer-events-none', // bypass hover styles
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronLeft(`${buttonIconClass} [[dir=rtl]_&]:rotate-180`),
      },
      next: {
        iconContent: () => svgs.chevronLeft(`${buttonIconClass} rotate-180 [[dir=rtl]_&]:rotate-0`),
      },
      prevYear: {
        iconContent: () => svgs.chevronsLeft(`${buttonIconClass} [[dir=rtl]_&]:rotate-180`),
      },
      nextYear: {
        iconContent: () => svgs.chevronsLeft(`${buttonIconClass} rotate-180 [[dir=rtl]_&]:rotate-0`),
      },
    },

    popoverCloseContent: () => svgs.x(`size-4 text-sm not-group-hover:opacity-65`),
  },
  views: baseEventCalendarOptions.views,
}
