import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

/*
TODO: focus state!?
TODO: focus-outline should be black on everything
TODO: muted text? is #424242 in Outlook
TODO: kill gray-500's
TODO: do primary-button hover effect on today-cirle too
TODO: prev/next icons look a little too faint
*/

const strongPressableClass = 'bg-(--fc-forma-strong)'
const borderColorClass = 'border-(--fc-forma-border)'

const primaryOutlineColorClass = 'outline-(--fc-forma-primary)'
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'
const outlineFocusClass = `${primaryOutlineColorClass} ${outlineWidthFocusClass}` // does NOT include offset

const primaryClass = 'bg-(--fc-forma-primary) text-(--fc-forma-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-forma-primary-over) focus-visible:bg-(--fc-forma-primary-over) active:bg-(--fc-forma-primary-down) ${outlineFocusClass} ${outlineOffsetClass}`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${outlineFocusClass}`

const ghostHoverClass = 'hover:bg-(--fc-forma-muted)'
const ghostPressableClass = `${ghostHoverClass} active:bg-(--fc-forma-strong) focus-visible:bg-(--fc-forma-strong) ${outlineFocusClass}`
const ghostButtonClass = `${ghostPressableClass} border border-transparent ${outlineFocusClass}`

const secondaryButtonClass = `${ghostPressableClass} border ${borderColorClass} ${outlineFocusClass}`

const mutedBgClass = 'bg-(--fc-forma-muted)'
const mutedFgClass = 'text-(--fc-forma-muted-foreground)'

const mutedClass = mutedBgClass // only uses bg
const mutedPressableClass = `${mutedClass} hover:bg-(--fc-forma-strong) ${outlineFocusClass}`

const unselectedButtonTextColorClass = 'text-(--fc-forma-tab-foreground)'
const unselectedButtonHoverBorderColorClass = 'hover:border-(--fc-forma-tab-over-border)'
const unselectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-tab-over)'
const unselectedButtonActiveBorderColorClass = 'active:border-(--fc-forma-tab-down-border)'
const unselectedButtonActiveBgColorClass = 'focus-visible:bg-(--fc-forma-tab-over) active:bg-(--fc-forma-tab-down)'
const unselectedButtonClass = `${unselectedButtonTextColorClass} border border-transparent ${unselectedButtonHoverBorderColorClass} ${unselectedButtonHoverBgColorClass} ${unselectedButtonActiveBorderColorClass} ${unselectedButtonActiveBgColorClass} ${outlineFocusClass}`

const selectedButtonBorderColorClass = 'border-(--fc-forma-tab-selected-border)'
const selectedButtonBgColorClass = 'bg-(--fc-forma-tab-selected)'
const selectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-tab-selected-over) focus-visible:bg-(--fc-forma-tab-selected-over)'
const selectedButtonActiveBgColorClass = 'active:bg-(--fc-forma-tab-selected-down)'
const selectedButtonClass = `border ${selectedButtonBorderColorClass} ${selectedButtonBgColorClass} ${selectedButtonHoverBgColorClass} ${selectedButtonActiveBgColorClass} ${outlineFocusClass}`

const buttonIconColorClass = 'text-(--fc-forma-secondary-icon)' // will only work for secondary!
const buttonIconClass = `size-5 ${buttonIconColorClass}` // will only work for secondary!

export const optionParams: EventCalendarOptionParams = {
  primaryClass,
  primaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  mutedBgClass,

  mutedClass,
  mutedPressableClass,
  strongPressableClass,

  faintBgClass: 'bg-(--fc-forma-faint)',
  highlightClass: 'bg-(--fc-forma-highlight)',

  borderColorClass,
  primaryBorderColorClass: 'border-(--fc-forma-primary)',
  strongBorderColorClass: 'border-(--fc-forma-strong-border)',
  nowBorderColorClass: 'border-(--fc-forma-primary)', // same as primary

  primaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineOffsetClass,
  outlineInsetClass,

  eventColor: 'var(--fc-forma-event)',
  eventContrastColor: '#fff', // TODO: var!
  bgEventColor: 'var(--color-green-500)', // TODO: var!
  bgEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'border border-(--fc-forma-border) bg-(--fc-forma-background) shadow-md',

  bgClass: 'bg-(--fc-forma-background)',
  bgRingColorClass: 'ring-(--fc-forma-background)',

  mutedFgClass,
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgClass} border ${optionParams.borderColorClass} rounded-sm shadow-xs overflow-hidden`,
    headerToolbarClass: `border-b ${optionParams.borderColorClass}`,
    footerToolbarClass: `border-t ${optionParams.borderColorClass}`,

    toolbarClass: 'p-3 items-center gap-3', // TODO: document how we do NOT need to justify-between or flex-row
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-xl',

    buttonGroupClass: 'items-center isolate',
    buttonClass: (data) => [
      'text-sm py-1.5 rounded-sm',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.isIconOnly
        // ghost-button
        ? ghostButtonClass
        : data.inSelectGroup
          ? data.isSelected
            // select-group SELECTED
            ? selectedButtonClass
            // select-group NOT-selected
            : unselectedButtonClass
          : data.isPrimary
            // primary button
            ? primaryButtonClass
            // secondary button
            : secondaryButtonClass,
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(buttonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        )
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(buttonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        )
      },
      prevYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(buttonIconClass, '[[dir=rtl]_&]:rotate-180'),
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(buttonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
        )
      },
    },

    popoverCloseContent: () => svgs.dismiss('size-5 opacity-65'),
  },
  views: baseEventCalendarOptions.views,
}
