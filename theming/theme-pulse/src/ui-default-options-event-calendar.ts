import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

// outline
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'
const tertiaryOutlineColorClass = 'outline-(--fc-pulse-tertiary)'
const tertiaryOutlineFocusClass = `${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`

// shadows
const smallBoxShadowClass = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const largeBoxShadowClass = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

// neutral buttons
const mutedHoverClass = 'hover:bg-(--fc-pulse-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} active:bg-(--fc-pulse-strong) focus-visible:bg-(--fc-pulse-muted)`
const faintHoverClass = 'hover:bg-(--fc-pulse-faint)'
const faintHoverPressableClass = `${faintHoverClass} active:bg-(--fc-pulse-muted) focus-visible:bg-(--fc-pulse-faint)`

// controls
const selectedButtonClass = `bg-(--fc-pulse-selected) text-(--fc-pulse-selected-foreground) ${largeBoxShadowClass} ${tertiaryOutlineFocusClass}`
const unselectedButtonClass = `text-(--fc-pulse-unselected-foreground) ${mutedHoverPressableClass} ${tertiaryOutlineFocusClass}`

// primary *toolbar button*
const primaryClass = 'bg-(--fc-pulse-primary) text-(--fc-pulse-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-pulse-primary-over) active:bg-(--fc-pulse-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border-transparent ${tertiaryOutlineFocusClass} ${outlineOffsetClass}`

// secondary *toolbar button*
// NOTE: does NOT have at-rest bg-color. must be applied by buttonGroupClass or buttonClass
// NOTE: border-color is determined by buttonClass setting below
// All this complexity is for getting border-top-left abutting buttons perfect
const secondaryPressableClass = `text-(--fc-pulse-secondary-foreground) hover:bg-(--fc-pulse-secondary-over) focus-visible:bg-(--fc-pulse-secondary-over) active:bg-(--fc-pulse-secondary-down)`
const secondaryButtonClass = `${secondaryPressableClass} ${tertiaryOutlineFocusClass} -outline-offset-1`
const secondaryButtonIconClass = 'size-5 text-(--fc-pulse-secondary-icon) group-hover:text-(--fc-pulse-secondary-icon-over) group-focus-visible:text-(--fc-pulse-secondary-icon-over)'

// tertiary
const tertiaryClass = 'bg-(--fc-pulse-tertiary) text-(--fc-pulse-tertiary-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-pulse-tertiary-over) active:bg-(--fc-pulse-tertiary-down) focus-visible:bg-(--fc-pulse-tertiary-over)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-pulse-tertiary-over) group-active:bg-(--fc-pulse-tertiary-down) group-focus-visible:bg-(--fc-pulse-tertiary-over)`

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = `text-(--fc-pulse-muted-foreground) group-hover:text-(--fc-pulse-foreground) group-focus-visible:text-(--fc-pulse-foreground)`

export const params: EventCalendarOptionParams = {
  // outline
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass,
  outlineInsetClass,
  tertiaryOutlineColorClass,

  // neutral backgrounds
  bgClass: 'bg-(--fc-pulse-background)',
  bgRingColorClass: 'ring-(--fc-pulse-background)',
  mutedBgClass: 'bg-(--fc-pulse-muted)',
  faintBgClass: 'bg-(--fc-pulse-faint)',
  faintSolidBgClass: '[background:linear-gradient(var(--fc-pulse-faint),var(--fc-pulse-faint))_var(--fc-pulse-background)]',

  // neutral foregrounds
  fgClass: 'text-(--fc-pulse-foreground)',
  mutedFgClass: 'text-(--fc-pulse-muted-foreground)',

  // neutral borders
  borderColorClass: 'border-(--fc-pulse-border)',
  strongBorderColorClass: 'border-(--fc-pulse-strong-border)',
  primaryBorderColorClass: 'border-(--fc-pulse-primary)',

  // neutral buttons
  strongSolidPressableClass: joinClassNames(
    '[background:linear-gradient(var(--fc-pulse-strong),var(--fc-pulse-strong))_var(--fc-pulse-background)]',
    'hover:[background:linear-gradient(var(--fc-pulse-stronger),var(--fc-pulse-stronger))_var(--fc-pulse-background)]',
    'active:[background:linear-gradient(var(--fc-pulse-strongest),var(--fc-pulse-strongest))_var(--fc-pulse-background)]',
  ),
  mutedPressableClass: 'bg-(--fc-pulse-muted) hover:bg-(--fc-pulse-strong) active:bg-(--fc-pulse-stronger)',
  mutedHoverClass,
  mutedHoverPressableClass,
  faintHoverClass,
  faintHoverPressableClass,

  // popover
  popoverClass: `bg-(--fc-pulse-background) border border-(--fc-pulse-strong-border) rounded-sm overflow-hidden shadow-md m-1`,
  popoverHeaderClass: `border-b border-(--fc-pulse-border) bg-(--fc-pulse-faint)`,

  // tertiary
  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  // event content
  eventColor: 'var(--fc-pulse-event)',
  eventContrastColor: 'var(--fc-pulse-event-contrast)',
  bgEventColor: 'var(--fc-pulse-background-event)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',

  // misc content
  highlightClass: 'bg-(--fc-pulse-highlight)',
  nowBorderColorClass: 'border-(--fc-pulse-now)',
}

const baseEventCalendarOptions = createEventCalendarOptions(params)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: 'gap-6',

    viewClass: [
      'rounded-sm overflow-hidden',
      `bg-(--fc-pulse-background) border border-(--fc-pulse-border) ${smallBoxShadowClass}`,
    ],

    toolbarClass: (data) => [
      'flex flex-row flex-wrap items-center justify-between gap-5',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: 'shrink-0 flex flex-row items-center gap-5',
    toolbarTitleClass: 'text-2xl font-bold text-(--fc-pulse-foreground)',

    buttonGroupClass: (data) => [
      'py-px rounded-sm flex flex-row items-center',
      data.isSelectGroup
        ? 'bg-(--fc-pulse-unselected)'
        : `bg-(--fc-pulse-secondary) ${smallBoxShadowClass}`
    ],

    buttonClass: (data) => [
      'group py-2 flex flex-row items-center text-sm',
      data.isIconOnly ? 'px-2.5' : 'px-4',
      data.inSelectGroup
        // all select-group buttons
        ? joinClassNames(
            'rounded-sm',
            data.isSelected
              ? selectedButtonClass
              : joinClassNames(
                  unselectedButtonClass,
                  '-my-px border-y border-transparent',
                )
          )
        // primary/secondary buttons
        : joinClassNames(
            'border',
            !data.inGroup
              ? 'rounded-sm'
              : '-my-px not-first:-ms-px first:rounded-s-sm last:rounded-e-sm',
            data.isPrimary
              // primary
              ? joinClassNames(
                  primaryButtonClass,
                  !data.inGroup && largeBoxShadowClass,
                )
              // secondary
              : joinClassNames(
                  secondaryButtonClass,
                  'border-(--fc-pulse-strong-border)',
                  !data.inGroup
                    ? `bg-(--fc-pulse-secondary) ${smallBoxShadowClass}`
                    : 'not-first:border-s-transparent not-last:border-e-(--fc-pulse-border)',
                )
          ),
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(secondaryButtonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        )
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(secondaryButtonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        )
      },
      prevYear: {
        iconContent: () => svgs.chevronsLeft(
          joinClassNames(secondaryButtonIconClass, '[[dir=rtl]_&]:rotate-180'),
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronsLeft(
          joinClassNames(secondaryButtonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
        )
      },
    },

    popoverCloseContent: () => svgs.x(`size-5 ${mutedFgPressableGroupClass}`),
  },
  views: baseEventCalendarOptions.views,
}
