import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgIcons from './ui-default-svgs.js'

const buttonIconClass = 'size-5 text-gray-400' // best???
const primaryButtonBgColorClass = 'bg-(--fc-pulse-primary-color)'
const primaryButtonBorderColorClass = 'border-(--fc-pulse-primary-color)'
const primaryButtonTextColorClass = 'text-(--fc-pulse-primary-text-color)'

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  todayCircleBgColorClass: 'bg-(--fc-pulse-today-color)',
  todayCircleTextColorClass: 'text-(--fc-pulse-today-text-color)',

  borderColorClass: 'border-gray-200',
  // majorBorderColorClass: '', // TODO

  eventColor: 'var(--fc-pulse-event-color)',
  eventContrastColor: 'var(--fc-pulse-event-contrast-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  // TODO: popoverClass

  pageBgColorClass: 'bg-(--fc-pulse-canvas-color)',
  pageBgColorOutlineClass: 'outline-(--fc-pulse-canvas-color)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    toolbarClass: 'gap-5 items-center',
    toolbarSectionClass: 'gap-5 items-center',
    toolbarTitleClass: 'text-2xl font-bold text-gray-800',
    // how to customize title??? with text parts??? -- TODO: make ticket for toolbarTitleContent -- show Apple Calendar screenshot
    // TODO: make ticket for buttons{}.beforeClass/afterClass, ButtonData.isFirst/isLast

    buttonGroupClass: (data) => [
      'items-center',
      data.isSelectGroup
        ? 'p-[1px] bg-[#eeeeef] rounded-[8px]'
        : `rounded-[9px] border border-[#d5d5d6] [box-shadow:0_1px_2px_rgba(0,0,0,0.1)]`
    ],

    buttonClass: (data) => [
      'text-sm',
      data.isPrimary ? '' : data.isDisabled ? 'text-gray-400' : 'text-gray-800',
      (!data.isSelected && !data.isDisabled && !data.isPrimary) && 'hover:bg-gray-100', // weird isPrimary
      (!data.inGroup || data.inSelectGroup) && 'rounded-sm', // standalone or in selector-group
      (data.inGroup && !data.inSelectGroup) && 'bg-white first:rounded-s-[9px] last:rounded-e-[9px] not-first:border-s not-first:border-s-gray-200', // opposite of ^^^
      !data.inGroup && (
        'rounded-[9px] border ' +
        (data.isPrimary
          ? `${primaryButtonBorderColorClass} ${primaryButtonBgColorClass} ${primaryButtonTextColorClass} [box-shadow:0_1px_3px_rgba(0,0,0,0.15)]` // weird border; more intense drop shadow
          : 'bg-white border-[#d5d5d6] [box-shadow:0_1px_2px_rgba(0,0,0,0.1)]')
      ),
      data.isIconOnly ? 'px-2.5' : 'px-4',
      'py-2',
      data.isSelected && `bg-white [box-shadow:0_1px_3px_rgba(0,0,0,0.2)]`,
    ],

    buttons: {
      // TODO: RTL
      prev: {
        iconContent: () => svgIcons.chevronLeft(buttonIconClass),
      },
      next: {
        iconContent: () => svgIcons.chevronRight(buttonIconClass),
      },
    },
  },
  views: baseEventCalendarOptions.views,
}
