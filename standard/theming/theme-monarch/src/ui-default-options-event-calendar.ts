import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams, transparentPressableClass } from './options-event-calendar.js'
import * as svgIcons from './ui-default-svgs.js'

const buttonIconClass = 'w-[1em] h-[1em] text-[1.5em]'
const buttonEffectClass = 'hover:brightness-80 active:brightness-120'
const primaryButtonClass = `bg-(--fc-monarch-primary) text-(--fc-monarch-on-primary) ${buttonEffectClass}`
const secondaryButtonClass = `bg-(--fc-monarch-secondary) text-(--fc-monarch-on-secondary) ${buttonEffectClass}`

function getPrimaryButtonClass(isDisabled: boolean) {
  return primaryButtonClass + (isDisabled ? ' opacity-90' : '')
}

function getSecondaryButtonClass(isDisabled: boolean) {
  return secondaryButtonClass + (isDisabled ? ' opacity-90' : '')
}

export const optionParams: EventCalendarOptionParams = {
  todayPillClass: (data) => 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-on-tertiary)' + (data.hasNavLink ? ' ' + buttonEffectClass : ''),
  pillClass: (data) => 'bg-(--fc-monarch-primary-container) text-(--fc-monarch-on-primary-container)' + (data.hasNavLink ? ' ' + buttonEffectClass : ''),

  highlightClass: 'bg-(--fc-monarch-primary-container) opacity-30',
  disabledBgClass: 'bg-gray-500/7', // TODO: better theme value

  borderColorClass: 'border-(--fc-monarch-outline-variant)',
  majorBorderColorClass: 'border-(--fc-monarch-outline)',
  alertBorderColorClass: 'border-(--fc-monarch-error)',

  // canvasBgColor?: string // eventually just canvasColor
  // canvasOutlineColor?: string // eventually just canvasColor

  eventColor: 'var(--fc-monarch-primary)',
  eventContrastColor: 'var(--fc-monarch-on-primary)',
  backgroundEventColor: 'var(--fc-monarch-tertiary)',
  backgroundEventColorClass: 'brightness-115 opacity-15',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    toolbarClass: 'p-4 items-center gap-3',
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

    buttonGroupClass: (data) => [
      'items-center isolate rounded-full',
      data.isViewGroup && 'border border-(--fc-monarch-outline-variant)'
    ],
    buttonClass: (data) => [
      data.inViewGroup && '-m-px', // HACK
      'inline-flex items-center justify-center py-3 text-sm rounded-full',
      data.inGroup && 'relative active:z-20 focus:z-20',
      data.isSelected ? 'z-10' : 'z-0',
      data.isDisabled && `pointer-events-none`, // bypass hover styles
      data.isIconOnly ? 'px-3' : 'px-5',
      (data.isIconOnly || (data.inViewGroup && !data.isSelected))
        ? transparentPressableClass
        : data.isSelected
          /* TODO
          text-color: --mio-theme-color-on-surface-variant
          bg-color: --mio-theme-color-secondary-container
          bg-color-hover: --mio-theme-color-on-surface-2 (essentially just slightly darker)
          button-group-bg: --mio-theme-color-surface-1 (second-to-lowest-contrast one)
          */
          ? getSecondaryButtonClass(data.isDisabled)
          : data.isPrimary
            ? getPrimaryButtonClass(data.isDisabled)
            : `border border-(--fc-monarch-outline-variant-original)`
    ],

    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
  },
  views: baseEventCalendarOptions.views,
}
