import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const bgClass = 'bg-(--fc-classic-background)' // TODO: make this a variable for all themes?
const bgOutlineColorClass = 'outline-(--fc-classic-background)'

const buttonIconClass = 'size-5'

const secondaryClass = 'bg-(--fc-classic-muted) text-(--fc-classic-muted-foreground)' // TODO: use transparent instead!
const secondaryPressableClass = secondaryClass // TODO: effect

const ghostHoverClass = 'hover:bg-(--fc-classic-glassy)'
const ghostPressableClass = `${ghostHoverClass} focus-visible:bg-gray-500/30` // TODO: use css variable!

const faintHoverClass = 'hover:bg-gray-500/5'
const faintPressableClass = `${faintHoverClass} focus-visible:bg-gray-500/20` // TODO: active class

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  // TODO
  mutedClass: 'bg-(--fc-classic-muted)',
  mutedPressableClass: 'bg-(--fc-classic-muted)',

  faintHoverClass,
  faintPressableClass,

  strongPressableClass: 'bg-(--fc-classic-strong)',

  mutedBgClass: 'bg-(--fc-classic-muted)', // TODO: ensure this is semitransparent!!!
  faintBgClass: 'bg-(--fc-classic-glassy)', // TODO: update this CSS variable!
  highlightClass: 'bg-(--fc-classic-highlight)',
  todayBgNotPrintClass: 'not-print:bg-(--fc-classic-today)',

  borderColorClass: 'border-(--fc-classic-border)',
  primaryBorderColorClass: 'border-[#3788d8]',
  strongBorderColorClass: 'border-(--fc-classic-strong-border)',
  nowBorderColorClass: 'border-(--fc-classic-now)',
  nowBorderStartColorClass: 'border-s-(--fc-classic-now)',
  nowBorderTopColorClass: 'border-t-(--fc-classic-now)',

  eventColor: '#3788d8', // TODO: put as css var
  eventContrastColor: 'var(--color-white)', // TODO: put as css var
  bgEventColor: 'var(--color-green-500)', // TODO: put as css var
  bgEventColorClass: 'opacity-15',

  popoverClass: `border border-(--fc-classic-border) ${bgClass} shadow-md`,

  bgClass,
  bgOutlineColorClass,

  mutedFgClass: 'text-(--fc-classic-muted-foreground)',
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

    popoverCloseContent: () => svgs.x(`size-4 text-sm`),
  },
  views: baseEventCalendarOptions.views,
}
