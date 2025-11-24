import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

// neutral buttons
const strongSolidPressableClass = '[background:linear-gradient(var(--fc-classic-strong),var(--fc-classic-strong))_var(--fc-classic-background)]'
const mutedHoverClass = 'hover:bg-(--fc-classic-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-classic-muted) active:bg-(--fc-classic-strong)`
const faintHoverClass = 'hover:bg-(--fc-classic-faint)'
const faintHoverPressableClass = `${faintHoverClass} focus-visible:bg-(--fc-classic-faint) active:bg-(--fc-classic-muted)`

const buttonIconClass = 'size-5'

export const params: EventCalendarOptionParams = {
  // outline
  outlineWidthClass: 'outline-2',
  outlineWidthFocusClass: 'focus-visible:outline-2',
  outlineOffsetClass: 'outline-offset-2',
  outlineInsetClass: '-outline-offset-2',
  primaryOutlineColorClass: 'outline-(--fc-classic-primary)',

  // neutral backgrounds
  bgClass: 'bg-(--fc-classic-background)',
  bgRingColorClass: 'ring-(--fc-classic-background)',
  mutedBgClass: 'bg-(--fc-classic-muted)',
  mutedSolidBgClass: '[background:linear-gradient(var(--fc-classic-muted),var(--fc-classic-muted))_var(--fc-classic-background)]',
  faintBgClass: 'bg-(--fc-classic-faint)',

  // neutral foregrounds
  mutedFgClass: 'text-(--fc-classic-muted-foreground)',
  faintFgClass: 'text-(--fc-classic-faint-foreground)',

  // neutral borders
  borderColorClass: 'border-(--fc-classic-border)',
  strongBorderColorClass: 'border-(--fc-classic-strong-border)',
  primaryBorderColorClass: 'border-(--fc-classic-primary)',

  // neutral buttons
  strongSolidPressableClass,
  mutedHoverClass,
  mutedHoverPressableClass,
  faintHoverClass,
  faintHoverPressableClass,

  // popover
  popoverClass: 'bg-(--fc-classic-background) border border-(--fc-classic-border) shadow-md',
  popoverHeaderClass: 'border-b border-(--fc-classic-border) bg-(--fc-classic-muted)',

  // event content
  eventColor: 'var(--fc-classic-event)',
  eventContrastColor: 'var(--fc-classic-event-contrast)',
  bgEventColor: 'var(--fc-classic-background-event)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',

  // misc content
  highlightClass: 'bg-(--fc-classic-highlight)',
  todayBgNotPrintClass: 'not-print:bg-(--fc-classic-today)',
  nowBorderColorClass: 'border-(--fc-classic-now)',
  nowBorderStartColorClass: 'border-s-(--fc-classic-now)',
  nowBorderTopColorClass: 'border-t-(--fc-classic-now)',
}

const baseEventCalendarOptions = createEventCalendarOptions(params)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: 'gap-5',
    viewClass: 'bg-(--fc-classic-background) border border-(--fc-classic-border)',

    /* Toolbar
    --------------------------------------------------------------------------------------------- */

    toolbarClass: (data) => [
      'flex flex-row flex-wrap items-center justify-between gap-3',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: 'shrink-0 flex flex-row items-center gap-3',
    toolbarTitleClass: 'text-2xl font-bold',

    buttonGroupClass: 'flex flex-row items-center',
    buttonClass: (data) => [
      'py-2 border-x flex flex-row items-center',
      'focus-visible:outline-3 outline-slate-600/50',
      'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
      'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
      'text-sm text-white print:text-black',
      data.isIconOnly ? 'px-2.5' : 'px-3',
      data.inGroup
        ? 'first:rounded-s-[4px] last:rounded-e-[4px]'
        : 'rounded-[4px]',
      data.isSelected // implies inGroup
        ? 'border-slate-900 bg-slate-800'
        : 'border-transparent bg-slate-700',
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

    /* Popover
    --------------------------------------------------------------------------------------------- */

    popoverCloseContent: () => svgs.x('size-5 text-sm not-group-hover:opacity-65'),
  },
  views: baseEventCalendarOptions.views,
}
