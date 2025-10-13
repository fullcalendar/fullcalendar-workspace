import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const bgClass = 'bg-(--fc-pulse-background)'
const bgRingColorClass = 'ring-(--fc-pulse-background)'

const buttonIconClass = 'size-5 text-(--fc-pulse-secondary-icon)' // TODO: add hover-color

const tertiaryOutlineColorClass = 'outline-(--fc-pulse-today)'
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'
const oulineFocusClass = `${tertiaryOutlineColorClass} ${outlineWidthFocusClass}`

// just for toolbar
const primaryClass = 'bg-(--fc-pulse-primary) text-(--fc-pulse-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-pulse-primary-hover) active:bg-(--fc-pulse-primary-active) focus-visible:bg-(--fc-pulse-primary-hover)`
const primaryButtonClass = `${primaryPressableClass} border-transparent ${oulineFocusClass} ${outlineOffsetClass}`

const borderColorClass = 'border-(--fc-pulse-border)'
const viewBorderColorClass = 'border-(--fc-pulse-view-border)'
const strongBorderColorClass = 'border-(--fc-pulse-strong-border)'

const fgClass = 'text-(--fc-pulse-foreground)'
const mutedFgClass = 'text-(--fc-pulse-muted-foreground)'
const strongFgClass = 'text-(--fc-pulse-strong-foreground)'

const tertiaryClass = 'bg-(--fc-pulse-today) text-(--fc-pulse-today-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-pulse-today-hover) active:bg-(--fc-pulse-today-active) focus-visible:bg-(--fc-pulse-today-hover)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-pulse-today-hover) group-active:bg-(--fc-pulse-today-active) group-focus-visible:bg-(--fc-pulse-today-hover)`

const ghostHoverClass = 'hover:bg-(--fc-pulse-muted)'
const ghostPressableClass = `${ghostHoverClass} active:bg-(--fc-pulse-strong) focus-visible:bg-(--fc-pulse-muted)`

const controlBgClass = 'bg-(--fc-pulse-tab)'
const controlCurrentColorClass = 'bg-(--fc-pulse-tab-selected)'
const controlHoverColorClass = 'hover:bg-(--fc-pulse-tab-hover)'

// just for toolbar
const secondaryPressableClass = `${bgClass} ${strongFgClass} ${controlHoverColorClass}`

const smallBoxShadowClass = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const largeBoxShadowClass = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

export const optionParams: EventCalendarOptionParams = {
  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  ghostHoverClass,
  ghostPressableClass,

  strongPressableClass: 'bg-(--fc-pulse-strong)',

  mutedBgClass: 'bg-(--fc-pulse-muted)',
  faintBgClass: 'bg-(--fc-pulse-faint)',
  highlightClass: 'bg-(--fc-pulse-highlight)',

  borderColorClass,
  strongBorderColorClass,
  nowBorderColorClass: 'border-(--fc-pulse-now)',

  tertiaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass,
  outlineInsetClass,

  eventColor: 'var(--fc-pulse-event)',
  eventContrastColor: 'var(--fc-pulse-event-contrast)',
  bgEventColor: 'var(--color-green-500)', // TODO: make this a theme variable
  bgEventColorClass: 'brightness-150 opacity-15',

  popoverClass: `${bgClass} border ${strongBorderColorClass} rounded-md shadow-md m-1`,

  bgClass,
  bgRingColorClass,

  fgClass,
  strongFgClass,
  mutedFgClass,
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
      `${bgClass} border ${viewBorderColorClass} ${smallBoxShadowClass}`,
      // ^^^ border needs more contrast bc of drop shadow, and to match controls
    ],

    toolbarClass: (data) => [
      'gap-5 items-center',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: 'gap-5 items-center',
    toolbarTitleClass: `text-2xl font-bold ${strongFgClass}`,
    // how to customize title??? with text parts??? -- TODO: make ticket for toolbarTitleContent -- show Apple Calendar screenshot
    // TODO: make ticket for buttons{}.beforeClass/afterClass, ButtonData.isFirst/isLast

    buttonGroupClass: (data) => [
      'isolate items-center rounded-sm',
      data.isSelectGroup
        ? `p-px ${controlBgClass}`
        : `border ${strongBorderColorClass} ${smallBoxShadowClass}`
    ],

    buttonClass: (data) => [
      'text-sm py-2',
      data.isIconOnly ? 'px-2.5' : 'px-4',
      data.inSelectGroup
        // all select-group buttons
        ? joinClassNames(
            'rounded-sm',
            strongFgClass,
            oulineFocusClass,
            data.isSelected
              // SELECTED select-group button
              ? `${controlCurrentColorClass} ${largeBoxShadowClass} z-10`
              // UN-selected select-group button
              : `${ghostPressableClass} z-0 focus-visible:z-20`
          )
        // primary/secondary buttons
        : joinClassNames(
            data.inGroup
              ? 'focus-visible:z-10'
              : 'rounded-sm',
            data.isPrimary
              // primary
              ? joinClassNames(
                  primaryButtonClass,
                  'border',
                  !data.inGroup && largeBoxShadowClass, // standalone
                )
              // secondary
              : joinClassNames(
                  `${secondaryPressableClass} ${oulineFocusClass}`, // no border color...
                  data.inGroup // border color is conditional...
                    ? `first:rounded-s-sm last:rounded-e-sm not-first:border-s ${borderColorClass}` // within group
                    : `border ${strongBorderColorClass} ${smallBoxShadowClass}`, // standalone
                )
          ),
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
        iconContent: () => svgs.chevronsLeft(
          joinClassNames(buttonIconClass, '[[dir=rtl]_&]:rotate-180'),
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronsLeft(
          joinClassNames(buttonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
        )
      },
    },

    popoverCloseContent: () => svgs.x(`size-4 ${strongFgClass}`),
  },
  views: baseEventCalendarOptions.views,
}
