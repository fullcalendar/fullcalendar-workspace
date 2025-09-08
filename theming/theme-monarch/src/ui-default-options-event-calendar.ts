import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams, transparentPressableClass } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const buttonTextClass = 'text-sm'
const iconSizeClass = 'size-5' // matches text-sm line-height

const buttonEffectClass = 'hover:brightness-80 active:brightness-120' // why not same as transparentPressableClass?
const primaryButtonClass = `bg-(--fc-monarch-primary) text-(--fc-monarch-on-primary) ${buttonEffectClass}`
const secondaryButtonClass = `bg-(--fc-monarch-secondary) text-(--fc-monarch-on-secondary) ${buttonEffectClass}`

function getPrimaryButtonClass(isDisabled: boolean) {
  return primaryButtonClass + (isDisabled ? ' opacity-90' : '')
}

function getSecondaryButtonClass(isDisabled: boolean) {
  return secondaryButtonClass + (isDisabled ? ' opacity-90' : '')
}

export const optionParams: EventCalendarOptionParams = {
  todayPillClass: (data) => joinClassNames(
    'bg-(--fc-monarch-tertiary) text-(--fc-monarch-on-tertiary)',
    data.hasNavLink && buttonEffectClass,
  ),
  miscPillClass: (data) => joinClassNames(
    'bg-(--fc-monarch-primary-container) text-(--fc-monarch-on-primary-container)',
    data.hasNavLink && buttonEffectClass,
  ),
  borderColorClass: 'border-(--fc-monarch-outline-variant)',
  nowIndicatorBorderColorClass: 'border-(--fc-monarch-error)',
  compactMoreLinkBorderColorClass: 'border-(--fc-monarch-primary)',
  highlightClass: 'bg-(--fc-monarch-primary-container) opacity-30',
  disabledBgClass: 'bg-gray-500/7',
  eventColor: 'var(--fc-monarch-primary)',
  eventContrastColor: 'var(--fc-monarch-on-primary)',
  backgroundEventColor: 'var(--fc-monarch-tertiary)',
  backgroundEventColorClass: 'brightness-115 opacity-15',
  popoverClass: 'border border-(--fc-monarch-outline-variant) rounded-lg bg-(--fc-monarch-canvas-color) dark:bg-(--fc-monarch-surface) dark:text-(--fc-monarch-on-surface) shadow-lg',
  bgColorClass: 'bg-(--fc-monarch-canvas-color)',
  bgColorOutlineClass: 'outline-(--fc-monarch-canvas-color)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgColorClass} border ${optionParams.borderColorClass} rounded-xl overflow-hidden`,

    toolbarClass: 'p-4 items-center gap-3',
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-xl md:text-2xl font-bold',

    buttons: {
      prev: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            iconSizeClass,
            data.direction === 'rtl' ? '-rotate-90' : 'rotate-90',
          )
        )
      },
      next: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            iconSizeClass,
            data.direction === 'rtl' ? 'rotate-90' : '-rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: (data) => svgs.chevronDoubleLeft(
          joinClassNames(
            iconSizeClass,
            data.direction === 'rtl' && 'rotate-180',
          )
        )
      },
      nextYear: {
        iconContent: (data) => svgs.chevronDoubleLeft(
          joinClassNames(
            iconSizeClass,
            data.direction !== 'rtl' && 'rotate-180',
          )
        )
      },
    },

    buttonGroupClass: (data) => [
      'items-center isolate rounded-full',
      data.isSelectGroup && 'inset-ring inset-ring-(--fc-monarch-outline-variant)'
    ],
    buttonClass: (data) => [
      `inline-flex items-center justify-center py-2.5 ${buttonTextClass} rounded-full`,
      data.inGroup && 'relative active:z-20 focus:z-20',
      data.isSelected ? 'z-10' : 'z-0',
      data.isDisabled && `pointer-events-none`, // bypass hover styles
      data.isIconOnly ? 'px-2.5' : 'px-5',
      (data.isIconOnly || (data.inSelectGroup && !data.isSelected))
        ? transparentPressableClass
        : data.isSelected
          ? getSecondaryButtonClass(data.isDisabled)
          : data.isPrimary
            ? getPrimaryButtonClass(data.isDisabled)
            : `inset-ring inset-ring-(--fc-monarch-outline-variant-original)`
    ],

    popoverCloseContent: () => svgs.x(`${buttonTextClass} ${iconSizeClass} opacity-65`),
  },
  views: baseEventCalendarOptions.views,
}
