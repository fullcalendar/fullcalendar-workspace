import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const buttonIconClass = 'size-5 text-(--fc-pulse-secondary-icon)' // TODO: add hover-color

// TODO: hover color
const primaryButtonBgColorClass = 'bg-(--fc-pulse-primary)'
const primaryButtonBorderColorClass = 'border-(--fc-pulse-primary)'
const primaryButtonTextColorClass = 'text-(--fc-pulse-primary-foreground)'

const borderColorClass = 'border-(--fc-pulse-border)'
const viewBorderColorClass = 'border-(--fc-pulse-view-border)'
const strongBorderColorClass = 'border-(--fc-pulse-strong-border)'

const smallBoxShadowClass = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const largeBoxShadowClass = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

const mutedFgClass = 'text-(--fc-pulse-muted-foreground)'
const fgClass = 'text-(--fc-pulse-foreground)'
const strongFgClass = 'text-(--fc-pulse-strong-foreground)'

/*
TODO: use these colors!!!
   --card: oklch(1 0 0);
   --card-foreground: oklch(0.145 0 0);
   --popover: oklch(1 0 0);
   --popover-foreground: oklch(0.145 0 0);
*/

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgClass: 'bg-(--fc-pulse-today)',
  todayCircleFgClass: 'text-(--fc-pulse-today-foreground)',

  borderColorClass,

  eventColor: 'var(--fc-pulse-event)',
  eventContrastColor: 'var(--fc-pulse-event-contrast)',
  bgEventColor: 'var(--color-green-500)', // yuck!!!
  bgEventColorClass: 'brightness-150 opacity-15',

  highlightClass: 'bg-(--fc-pulse-highlight)',

  popoverClass: `bg-(--fc-pulse-background) border ${strongBorderColorClass} rounded-md shadow-md m-1`,

  bgOutlineClass: 'outline-(--fc-pulse-background)',
  bgClass: 'bg-(--fc-pulse-background)',

  glassyBgClass: 'bg-(--fc-pulse-glassy)',
  mutedBgClass: 'bg-(--fc-pulse-muted)',
  strongBgClass: 'bg-(--fc-pulse-strong)',

  ghostButtonClass: 'hover:bg-(--fc-pulse-glassy) focus-visible:bg-(--fc-pulse-glassy)',

  strongFgClass,
  fgClass,
  mutedFgClass,

  nowBorderColorClass: 'border-(--fc-pulse-now)',
  strongBorderColorClass,
}

const controlBgClass = 'bg-(--fc-pulse-tab)'
const controlCurrentColorClass = 'bg-(--fc-pulse-tab-selected)'
const controlHoverColorClass = 'hover:bg-(--fc-pulse-tab-hover)'

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
      `${optionParams.bgClass} border ${viewBorderColorClass} ${smallBoxShadowClass}`,
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
      'items-center rounded-sm',
      data.isSelectGroup
        ? `p-px ${controlBgClass}`
        : `border ${strongBorderColorClass} ${smallBoxShadowClass} overflow-hidden`
    ],

    buttonClass: (data) => [
      'text-sm py-2',
      data.isIconOnly ? 'px-2.5' : 'px-4',
      data.inSelectGroup
        // all select-group buttons
        ? joinClassNames(
            'rounded-sm',
            strongFgClass,
            data.isSelected
              // SELECTED select-group button
              ? `${controlCurrentColorClass} ${largeBoxShadowClass}`
              // UN-selected select-group button
              : optionParams.ghostButtonClass // TODO: a little bit fuzzy
          )
        // primary/secondary buttons
        : joinClassNames(
            !data.inGroup && 'rounded-sm',
            data.isPrimary
              // primary
              ? joinClassNames(
                  `${primaryButtonBorderColorClass} ${primaryButtonBgColorClass} ${primaryButtonTextColorClass}`,
                  !data.inGroup && largeBoxShadowClass, // standalone
                )
              // secondary
              : joinClassNames(
                  `${optionParams.bgClass} ${strongFgClass} ${controlHoverColorClass}`,
                  data.inGroup
                    ? `not-first:border-s ${borderColorClass}` // within group
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
