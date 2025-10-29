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
const oulineFocusClass = `${tertiaryOutlineColorClass} ${outlineWidthFocusClass}`

// shadows
const smallBoxShadowClass = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const largeBoxShadowClass = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

// primary *toolbar button*
const primaryClass = 'bg-(--fc-pulse-primary) text-(--fc-pulse-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-pulse-primary-over) active:bg-(--fc-pulse-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border-transparent ${oulineFocusClass} ${outlineOffsetClass}`

// secondary *toolbar button*
const secondaryPressableClass = `bg-(--fc-pulse-secondary) hover:bg-(--fc-pulse-secondary-over) focus-visible:bg-(--fc-pulse-secondary-over) active:bg-(--fc-pulse-secondary-down)`
const secondaryButtonClass = `${secondaryPressableClass} border-(--fc-pulse-border) ${oulineFocusClass}`
const secondaryButtonIconClass = 'size-5 text-(--fc-pulse-secondary-icon) group-hover:text-(--fc-pulse-secondary-icon-over) group-focus-visible:text-(--fc-pulse-secondary-icon-over)'

// tertiary
const tertiaryClass = 'bg-(--fc-pulse-tertiary) text-(--fc-pulse-tertiary-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-pulse-tertiary-over) active:bg-(--fc-pulse-tertiary-down) focus-visible:bg-(--fc-pulse-tertiary-over)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-pulse-tertiary-over) group-active:bg-(--fc-pulse-tertiary-down) group-focus-visible:bg-(--fc-pulse-tertiary-over)`

// interactive neutral foregrounds
const mutedFgPressableGroupClass = `text-(--fc-pulse-muted-foreground) group-hover:text-(--fc-pulse-foreground) group-focus-visible:text-(--fc-pulse-foreground)`

// faint-on-hover
const faintHoverClass = 'hover:bg-(--fc-pulse-faint)'
const faintHoverPressableClass = `${faintHoverClass} active:bg-(--fc-pulse-muted) focus-visible:bg-(--fc-pulse-faint)`

// muted-on-hover
const mutedHoverClass = 'hover:bg-(--fc-pulse-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} active:bg-(--fc-pulse-strong) focus-visible:bg-(--fc-pulse-muted)`

// controls
const selectedButtonClass = `bg-(--fc-pulse-selected) text-(--fc-pulse-selected-foreground) ${largeBoxShadowClass} ${oulineFocusClass}`
const unselectedButtonClass = `text-(--fc-pulse-unselected-foreground) ${mutedHoverPressableClass} ${oulineFocusClass}`

// event colors
const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]'

export { mutedFgPressableGroupClass }

export const optionParams: EventCalendarOptionParams = {
  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  mutedHoverClass,
  mutedHoverPressableClass,

  faintHoverClass,
  faintHoverPressableClass,

  // TODO: move this up?
  strongSolidPressableClass: joinClassNames(
    '[background:linear-gradient(var(--fc-pulse-strong),var(--fc-pulse-strong))_var(--fc-pulse-background)]',
    'hover:[background:linear-gradient(var(--fc-pulse-stronger),var(--fc-pulse-stronger))_var(--fc-pulse-background)]',
    'active:[background:linear-gradient(var(--fc-pulse-strongest),var(--fc-pulse-strongest))_var(--fc-pulse-background)]',
  ),

  mutedBgClass: 'bg-(--fc-pulse-muted)',
  mutedSolidBgClass: '[background:linear-gradient(var(--fc-pulse-muted),var(--fc-pulse-muted))_var(--fc-pulse-background)]',
  faintBgClass: 'bg-(--fc-pulse-faint)',
  highlightClass: 'bg-(--fc-pulse-highlight)',

  borderColorClass: 'border-(--fc-pulse-border)',
  strongBorderColorClass: 'border-(--fc-pulse-strong-border)',
  nowBorderColorClass: 'border-(--fc-pulse-now)',
  primaryBorderColorClass: 'border-(--fc-pulse-primary)',

  tertiaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass,
  outlineInsetClass,

  eventColor: 'var(--fc-pulse-event)',
  eventContrastColor: 'var(--fc-pulse-event-contrast)',
  bgEventColor: 'var(--fc-pulse-background-event)',
  bgEventBgClass,

  popoverClass: `bg-(--fc-pulse-background) border border-(--fc-pulse-strong-border) rounded-sm overflow-hidden shadow-md m-1`,
  popoverHeaderClass: `border-b border-(--fc-pulse-strong-border) bg-(--fc-pulse-muted)`,

  bgClass: 'bg-(--fc-pulse-background)',
  bgRingColorClass: 'ring-(--fc-pulse-background)',

  fgClass: 'text-(--fc-pulse-foreground)',
  strongFgClass: 'text-(--fc-pulse-strong-foreground)',
  mutedFgClass: 'text-(--fc-pulse-muted-foreground)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

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
      // ^^^ border needs more contrast bc of drop shadow, and to match controls
    ],

    toolbarClass: (data) => [
      'gap-5 items-center',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: 'gap-5 items-center',
    toolbarTitleClass: `text-2xl font-bold text-(--fc-pulse-strong-foreground)`,
    // how to customize title??? with text parts??? -- TODO: make ticket for toolbarTitleContent -- show Apple Calendar screenshot
    // TODO: make ticket for buttons{}.beforeClass/afterClass, ButtonData.isFirst/isLast

    buttonGroupClass: (data) => [
      'isolate items-center rounded-sm',
      data.isSelectGroup
        ? `p-px bg-(--fc-pulse-unselected)`
        : `border border-(--fc-pulse-strong-border) ${smallBoxShadowClass}`
    ],

    buttonClass: (data) => [
      'inline-flex flex-row text-sm py-2 group',
      data.isIconOnly ? 'px-2.5' : 'px-4',
      data.inSelectGroup
        // all select-group buttons
        ? joinClassNames(
            'rounded-sm',
            data.isSelected
              ? selectedButtonClass
              : unselectedButtonClass
          )
        // primary/secondary buttons
        : joinClassNames(
            !data.inGroup && 'rounded-sm',
            data.isPrimary
              // primary
              ? joinClassNames(
                  primaryButtonClass,
                  'border',
                  !data.inGroup && largeBoxShadowClass, // standalone
                )
              // secondary
              : joinClassNames(
                  secondaryButtonClass,
                  data.inGroup
                    ? `first:rounded-s-sm last:rounded-e-sm not-first:border-s` // within group
                    : `border ${smallBoxShadowClass}`, // standalone
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
