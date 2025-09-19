import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const buttonIconClass = 'size-5 text-(--fc-pulse-icon-color)' // TODO: add hover-color

// TODO: hover color
const primaryButtonBgColorClass = 'bg-(--fc-pulse-primary-color)'
const primaryButtonBorderColorClass = 'border-(--fc-pulse-primary-color)'
const primaryButtonTextColorClass = 'text-(--fc-pulse-primary-text-color)'

const borderColorClass0 = 'border-(--fc-pulse-border0)'
const borderColorClass1 = 'border-(--fc-pulse-border1)'
const borderColorClass2 = 'border-(--fc-pulse-border2)'

const boxShadowClass0 = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const boxShadowClass1 = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

// const textColorClass0 = 'text-(--fc-pulse-text-color0)' // kill?
const textColorClass1 = 'text-(--fc-pulse-text-color1)'
const textColorClass2 = 'text-(--fc-pulse-text-color2)'
const textColorClass3 = 'text-(--fc-pulse-text-color3)'

/*
TODO: use these colors!!!
   --card: oklch(1 0 0);
   --card-foreground: oklch(0.145 0 0);
   --popover: oklch(1 0 0);
   --popover-foreground: oklch(0.145 0 0);
*/

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgColorClass: 'bg-(--fc-pulse-today-color)',
  todayCircleTextColorClass: 'text-(--fc-pulse-today-text-color)',

  borderColorClass: borderColorClass0,

  eventColor: 'var(--fc-pulse-event-color)',
  eventContrastColor: 'var(--fc-pulse-event-contrast-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  highlightClass: 'bg-(--fc-pulse-highlight-color)',

  popoverClass: `bg-(--fc-pulse-canvas-color) border ${borderColorClass2} rounded-md shadow-md m-1`,

  // TODO: popoverClass

  bgColorOutlineClass: 'outline-(--fc-pulse-canvas-color)',
  bgColorClass: 'bg-(--fc-pulse-canvas-color)',

  mutedOpaqueBgClass: 'bg-(--fc-pulse-muted-opaque)',
  mutedTransparentBgClass: 'bg-(--fc-pulse-muted-transparent)',

  ghostButtonClass: 'hover:bg-(--fc-pulse-muted-transparent) focus-visible:bg-(--fc-pulse-muted-transparent)',

  nonMutedTextClass: textColorClass3,
  mutedTextClass: textColorClass2,
  mutedExtraTextClass: textColorClass1,
}

const controlBgClass = 'bg-(--fc-pulse-control-color)'
const controlCurrentColorClass = 'bg-(--fc-pulse-control-current-color)'
const controlHoverColorClass = 'hover:bg-(--fc-pulse-control-hover-color)'

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
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? '-rotate-90' : 'rotate-90',
          )
        )
      },
      next: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? 'rotate-90' : '-rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: (data) => svgs.chevronsLeft(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' && 'rotate-180',
          )
        )
      },
      nextYear: {
        iconContent: (data) => svgs.chevronsLeft(
          joinClassNames(
            buttonIconClass,
            data.direction !== 'rtl' && 'rotate-180',
          )
        )
      },
    },

    popoverCloseContent: () => svgs.x('size-4'),
  },
  views: baseEventCalendarOptions.views,
}
