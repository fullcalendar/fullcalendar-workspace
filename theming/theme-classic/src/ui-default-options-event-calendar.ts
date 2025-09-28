import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const bgColorClass = 'bg-(--fc-classic-background)'
const bgColorOutlineClass = 'outline-(--fc-classic-background)'

const buttonIconClass = 'size-5'

export const optionParams: EventCalendarOptionParams = {
  borderColorClass: 'border-(--fc-classic-border)',
  strongBorderColorClass: 'border-(--fc-classic-strong-border)',
  nowBorderColorClass: 'border-(--fc-classic-now)',
  nowBorderStartColorClass: 'border-s-(--fc-classic-now)',
  nowBorderTopColorClass: 'border-t-(--fc-classic-now)',

  compactMoreLinkBorderColorClass: 'border-[#3788d8]',

  todayBgClass: 'not-print:bg-(--fc-classic-today)',
  glassyBgClass: 'bg-(--fc-classic-glassy)',
  mutedBgClass: 'bg-(--fc-classic-muted)',
  strongBgClass: 'bg-(--fc-classic-strong)',
  highlightClass: 'bg-(--fc-classic-highlight)',

  mutedFgClass: 'text-(--fc-classic-muted-foreground)',

  eventColor: '#3788d8', // TODO: put as css var
  eventContrastColor: 'var(--color-white)', // TODO: put as css var
  bgEventColor: 'var(--color-green-500)', // TODO: put as css var
  bgEventColorClass: 'opacity-15',

  hoverRowClass: 'hover:bg-gray-500/5 focus-visible:bg-gray-500/20',
  hoverButtonClass: 'hover:bg-gray-500/20 focus-visible:bg-gray-500/30',
  selectedButtonClass: 'bg-gray-500/40',

  popoverClass: `border border-(--fc-classic-border) ${bgColorClass} shadow-md`,

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
    viewClass: `border ${optionParams.borderColorClass} ${optionParams.bgColorClass}`,

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
