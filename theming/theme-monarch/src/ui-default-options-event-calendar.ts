import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const buttonTextClass = 'text-sm'
const iconSizeClass = 'size-5' // matches text-sm line-height

const secondaryClass = 'bg-(--fc-monarch-secondary) text-(--fc-monarch-secondary-foreground)'
const tertiaryClass = 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-tertiary-foreground)'
const buttonEffectClass = 'hover:brightness-80 active:brightness-120'

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass: `${secondaryClass} ${buttonEffectClass}`,
  tertiaryClass,
  tertiaryPressableClass: `${tertiaryClass} ${buttonEffectClass}`,

  ghostHoverClass: 'hover:bg-(--fc-monarch-muted-wash)',
  ghostPressableClass: 'hover:bg-(--fc-monarch-muted-wash) active:bg-(--fc-monarch-strong-wash) focus-visible:bg-(--fc-monarch-strong-wash)',
  ghostSelectedClass: 'bg-(--fc-monarch-strong-wash)',

  blockFocusableClass: 'focus-visible:outline-[3px] focus-visible:outline-(--fc-monarch-strong-wash)',
  blockSelectedClass: 'outline-[3px] outline-(--fc-monarch-strong-wash)',

  mutedBgClass: 'bg-(--fc-monarch-muted)',
  mutedWashClass: 'bg-(--fc-monarch-muted-wash)',
  strongBgClass: 'bg-(--fc-monarch-strong)',
  highlightClass: 'bg-(--fc-monarch-secondary) opacity-30',

  borderColorClass: 'border-(--fc-monarch-border)',
  primaryBorderColorClass: 'border-(--fc-monarch-primary)',
  strongBorderColorClass: 'border-(--fc-monarch-strong-border)',
  nowBorderColorClass: 'border-(--fc-monarch-now)',

  eventColor: 'var(--fc-monarch-primary)',
  eventContrastColor: 'var(--fc-monarch-primary-foreground)',
  bgEventColor: 'var(--fc-monarch-tertiary)',
  bgEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'border border-(--fc-monarch-border) rounded-lg bg-(--fc-monarch-popover) text-(--fc-monarch-popover-foreground) shadow-lg',

  bgClass: 'bg-(--fc-monarch-background)',
  bgOutlineClass: 'outline-(--fc-monarch-background)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgClass} border ${optionParams.borderColorClass} rounded-xl overflow-hidden`,

    toolbarClass: 'p-4 items-center gap-3',
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-2xl font-bold',

    buttonGroupClass: (data) => [
      'items-center isolate rounded-full',
      data.isSelectGroup && 'border border-(--fc-monarch-border)'
    ],
    buttonClass: (data) => [
      `inline-flex items-center justify-center py-2.5 ${buttonTextClass} rounded-full border`,
      data.inGroup && 'relative active:z-20 focus-visible:z-20',
      data.isSelected ? 'z-10' : 'z-0',
      data.isIconOnly ? 'px-2.5' : 'px-5',
      data.inSelectGroup && '-m-px',
      // TODO: better structure
      (data.isIconOnly || (data.inSelectGroup && !data.isSelected))
        ? `${optionParams.ghostPressableClass} border-transparent`
        : data.isSelected
          ? `bg-(--fc-monarch-tab-selected) text-(--fc-monarch-tab-selected-foreground) border-transparent ${buttonEffectClass}` // solid gray
          : data.isPrimary
            ? `bg-(--fc-monarch-primary) text-(--fc-monarch-primary-foreground) border-transparent ${buttonEffectClass}` // primary color
            : joinClassNames(
                optionParams.ghostPressableClass,
                'border-(--fc-monarch-secondary-border)' // bordered gray
              )
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(
            iconSizeClass,
            'rotate-90 [[dir=rtl]_&]:-rotate-90',
          )
        )
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(
            iconSizeClass,
            '-rotate-90 [[dir=rtl]_&]:rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(
            iconSizeClass,
            '[[dir=rtl]_&]:rotate-180'
          )
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(
            iconSizeClass,
            'rotate-180 [[dir=rtl]_&]:rotate-0',
          )
        )
      },
    },

    popoverCloseContent: () => svgs.x(`${buttonTextClass} ${iconSizeClass} opacity-65`),
  },
  views: baseEventCalendarOptions.views,
}
