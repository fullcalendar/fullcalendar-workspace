import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const buttonIconClass = 'size-5 text-(--fc-pulse-secondary-icon)' // TODO: add hover-color

// TODO: hover color
const primaryButtonBgColorClass = 'bg-(--fc-pulse-primary)'
const primaryButtonBorderColorClass = 'border-(--fc-pulse-primary)'
const primaryButtonTextColorClass = 'text-(--fc-pulse-primary-foreground)'

const borderColorClass0 = 'border-(--fc-pulse-border)'
const borderColorClass1 = 'border-(--fc-pulse-view-border)'
const borderColorClass2 = 'border-(--fc-pulse-strong-border)'

const boxShadowClass0 = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const boxShadowClass1 = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

const textColorClass1 = 'text-(--fc-pulse-muted-foreground)'
const textColorClass2 = 'text-(--fc-pulse-foreground)'
const textColorClass3 = 'text-(--fc-pulse-strong-foreground)'

/*
TODO: use these colors!!!
   --card: oklch(1 0 0);
   --card-foreground: oklch(0.145 0 0);
   --popover: oklch(1 0 0);
   --popover-foreground: oklch(0.145 0 0);
*/

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgColorClass: 'bg-(--fc-pulse-today)',
  todayCircleTextColorClass: 'text-(--fc-pulse-today-foreground)',

  borderColorClass: borderColorClass0,

  eventColor: 'var(--fc-pulse-event)',
  eventContrastColor: 'var(--fc-pulse-event-contrast)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  highlightClass: 'bg-(--fc-pulse-highlight)',

  popoverClass: `bg-(--fc-pulse-background) border ${borderColorClass2} rounded-md shadow-md m-1`,

  // TODO: popoverClass

  bgColorOutlineClass: 'outline-(--fc-pulse-background)',
  bgColorClass: 'bg-(--fc-pulse-background)',

  mutedTransparentBgClass: 'bg-(--fc-pulse-glassy)',
  mutedBgClass: 'bg-(--fc-pulse-muted)',
  neutralBgClass: 'bg-(--fc-pulse-strong)',

  ghostButtonClass: 'hover:bg-(--fc-pulse-glassy) focus-visible:bg-(--fc-pulse-glassy)',

  nonMutedTextClass: textColorClass3,
  mutedTextClass: textColorClass2, // bad name now!
  mutedExtraTextClass: textColorClass1,

  nowIndicatorBorderColorClass: 'border-(--fc-pulse-now)',
  majorBorderColorClass: borderColorClass2,
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
      `${optionParams.bgColorClass} border ${borderColorClass1} ${boxShadowClass0}`,
      // ^^^ border needs more contrast bc of drop shadow, and to match controls
    ],

    toolbarClass: (data) => [
      'gap-5 items-center',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: 'gap-5 items-center',
    toolbarTitleClass: `text-2xl font-bold ${textColorClass3}`,
    // how to customize title??? with text parts??? -- TODO: make ticket for toolbarTitleContent -- show Apple Calendar screenshot
    // TODO: make ticket for buttons{}.beforeClass/afterClass, ButtonData.isFirst/isLast

    buttonGroupClass: (data) => [
      'items-center rounded-sm',
      data.isSelectGroup
        ? `p-px ${controlBgClass}`
        : `border ${borderColorClass2} ${boxShadowClass0} overflow-hidden`
    ],

    buttonClass: (data) => [
      'text-sm py-2',
      data.isIconOnly ? 'px-2.5' : 'px-4',
      data.inSelectGroup
        // all select-group buttons
        ? joinClassNames(
            'rounded-sm',
            textColorClass3,
            data.isSelected
              // SELECTED select-group button
              ? `${controlCurrentColorClass} ${boxShadowClass1}`
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
                  !data.inGroup && boxShadowClass1, // standalone
                )
              // secondary
              : joinClassNames(
                  `${optionParams.bgColorClass} ${textColorClass3} ${controlHoverColorClass}`,
                  data.inGroup
                    ? `not-first:border-s ${borderColorClass0}` // within group
                    : `border ${borderColorClass2} ${boxShadowClass0}`, // standalone
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

    popoverCloseContent: () => svgs.x(`size-4 ${textColorClass3}`),
  },
  views: baseEventCalendarOptions.views,
}
