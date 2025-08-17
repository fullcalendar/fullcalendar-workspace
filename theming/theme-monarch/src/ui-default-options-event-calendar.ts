import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
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

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  todayPillClass: (data) => 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-on-tertiary)' + (data.hasNavLink ? ' ' + buttonEffectClass : ''),
  pillClass: (data) => 'bg-(--fc-monarch-primary-container) text-(--fc-monarch-on-primary-container)' + (data.hasNavLink ? ' ' + buttonEffectClass : ''),

  highlightClass: 'bg-(--fc-monarch-primary-container) opacity-30',
  disabledBgClass: 'bg-gray-500/7', // TODO: better theme value

  borderColorClass: 'border-(--fc-monarch-outline-variant)',
  nowIndicatorBorderColorClass: 'border-(--fc-monarch-error)',

  eventColor: 'var(--fc-monarch-primary)',
  eventContrastColor: 'var(--fc-monarch-on-primary)',
  backgroundEventColor: 'var(--fc-monarch-tertiary)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'border border-(--fc-monarch-outline-variant) rounded-lg bg-(--fc-monarch-canvas-color) dark:bg-(--fc-monarch-surface) dark:text-(--fc-monarch-on-surface) shadow-lg',

  pageBgColorClass: 'bg-(--fc-monarch-canvas-color)',
  pageBgColorOutlineClass: 'outline-(--fc-monarch-canvas-color)',
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
        iconContent: (data) => svgIcons.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? '-rotate-90' : 'rotate-90',
          )
        )
      },
      next: {
        iconContent: (data) => svgIcons.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? 'rotate-90' : '-rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: (data) => svgIcons.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' && 'rotate-180',
          )
        )
      },
      nextYear: {
        iconContent: (data) => svgIcons.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            data.direction !== 'rtl' && 'rotate-180',
          )
        )
      },
    },

    buttonGroupClass: (data) => [
      'items-center isolate rounded-full',
      data.isSelectGroup && 'border border-(--fc-monarch-outline-variant)'
    ],
    buttonClass: (data) => [
      data.inSelectGroup && '-m-px', // HACK
      'inline-flex items-center justify-center py-3 text-sm rounded-full',
      data.inGroup && 'relative active:z-20 focus:z-20',
      data.isSelected ? 'z-10' : 'z-0',
      data.isDisabled && `pointer-events-none`, // bypass hover styles
      data.isIconOnly ? 'px-3' : 'px-5',
      (data.isIconOnly || (data.inSelectGroup && !data.isSelected))
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
