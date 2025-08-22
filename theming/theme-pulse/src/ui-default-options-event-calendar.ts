import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const buttonIconClass = 'size-5 text-gray-400' // best???. TODO: add hover-color
const primaryButtonBgColorClass = 'bg-(--fc-pulse-primary-color)'
const primaryButtonBorderColorClass = 'border-(--fc-pulse-primary-color)'
const primaryButtonTextColorClass = 'text-(--fc-pulse-primary-text-color)'

const borderColorClass0 = 'border-gray-200'
const borderColorClass1 = 'border-[rgb(228_228_229)]'
const borderColorClass2 = 'border-[#d5d5d6]'

const boxShadowClass0 = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const boxShadowClass1 = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

const mutedBgClass0 = 'bg-[#f6f6f6]'
const mutedBgClass1 = 'bg-[#eeeeef]'
const mutedBgClass2Hover = 'hover:bg-[#e5e5e6]'

const textColorClass0 = 'text-gray-400'
const textColorClass1 = 'text-gray-500'
const textColorClass2 = 'text-gray-700'
const textColorClass3 = 'text-gray-800'

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgColorClass: 'bg-(--fc-pulse-today-color)',
  todayCircleTextColorClass: 'text-(--fc-pulse-today-text-color)',

  mutedBgClass: mutedBgClass0,

  mutedTextClass: textColorClass2,
  mutedExtraTextClass: textColorClass1,

  borderColorClass: borderColorClass0,

  eventColor: 'var(--fc-pulse-event-color)',
  eventContrastColor: 'var(--fc-pulse-event-contrast-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  // TODO: popoverClass

  bgColorClass: 'bg-(--fc-pulse-canvas-color)',
  bgColorOutlineClass: 'outline-(--fc-pulse-canvas-color)',
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
      `border ${borderColorClass1} ${boxShadowClass0}`,
      // ^^^ border needs more contrast bc of drop shadow, and to match controls
    ],

    toolbarClass: 'gap-5 items-center',
    toolbarSectionClass: 'gap-5 items-center',
    toolbarTitleClass: `text-2xl font-bold ${textColorClass3}`,
    // how to customize title??? with text parts??? -- TODO: make ticket for toolbarTitleContent -- show Apple Calendar screenshot
    // TODO: make ticket for buttons{}.beforeClass/afterClass, ButtonData.isFirst/isLast

    buttonGroupClass: (data) => [
      'items-center rounded-sm',
      data.isSelectGroup
        ? `p-px ${mutedBgClass1}`
        : `border ${borderColorClass2} ${boxShadowClass0} overflow-hidden`
    ],

    buttonClass: (data) => [
      'text-sm py-2',
      data.isIconOnly ? 'px-2.5' : 'px-4',
      data.inSelectGroup
        // all select-group buttons
        ? joinClassNames(
            'rounded-sm',
            data.isSelected
              // SELECTED select-group button
              ? `bg-white ${boxShadowClass1}`
              // UN-selected select-group button
              : mutedBgClass2Hover // TODO: a little bit fuzzy
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
                  `bg-white hover:bg-gray-100 ${borderColorClass2}`,
                  data.inGroup
                    ? `not-first:border-s ${borderColorClass0}` // within group
                    : `border ${borderColorClass2} ${boxShadowClass0}`, // standalone
                  data.isDisabled ? textColorClass0 : textColorClass3,
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
  },
  views: baseEventCalendarOptions.views,
}
