import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const selectBgClass = 'bg-(--fc-breezy-select-bg)'
const selectTextClass = 'text-(--fc-breezy-select-text)'
const nonSelectTextClass = 'text-(--fc-breezy-non-select-text)'
const hoverSelectTextClass = 'hover:text-(--fc-breezy-select-text)' // best name?

export const optionParams: EventCalendarOptionParams = {
  // always considered a button, and has hover effect. okay?
  primaryBgColorClass: 'bg-(--fc-breezy-primary-color) hover:bg-(--fc-breezy-primary-hover-color)',
  primaryTextColorClass: 'text-(--fc-breezy-primary-text-color)',
  primaryBorderColorClass: 'border-(--fc-breezy-primary-color) hover:border-(--fc-breezy-primary-hover-color)',
  // weird we need to do this border stuff too!!!

  eventColor: 'var(--fc-breezy-event-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'bg-(--fc-breezy-popover-color) border border-(--fc-breezy-popover-border-color) rounded-lg shadow-lg',

  bgColorClass: 'bg-(--fc-breezy-canvas-color)',
  bgColorOutlineClass: 'outline-(--fc-breezy-canvas-color)',

  borderLowColorClass: 'border-(--fc-breezy-border-low-color)',
  borderMidColorClass: 'border-(--fc-breezy-border-mid-color)',
  borderStartMedColorClass: 'border-s-(--fc-breezy-border-mid-color)',
  borderHighColorClass: 'border-(--fc-breezy-border-high-color)',
  borderBottomHighColorClass: 'border-b-(--fc-breezy-border-high-color)',

  mutedBgClass: 'bg-(--fc-breezy-muted-color)',
  highlightClass: 'bg-(--fc-breezy-highlight-color)',
  ghostButtonClass: 'hover:bg-gray-500/20 focus-visible:bg-gray-500/30', // TODO: kill gray-500

  textLowColorClass: 'text-(--fc-breezy-text-low-color)',
  textMidColorClass: 'text-(--fc-breezy-text-mid-color)',
  textHighColorClass: 'text-(--fc-breezy-text-high-color)',
  textHeaderColorClass: 'text-(--fc-breezy-text-header-color)',
}

const secondaryButtonClass = 'group text-(--fc-breezy-secondary-text-color) bg-(--fc-breezy-secondary-color) hover:bg-(--fc-breezy-secondary-hover-color) border-(--fc-breezy-secondary-border-color)'

// NOTE: only works within secondary button
// best? to sync to line-height???
const buttonIconClass = 'size-5 text-(--fc-breezy-secondary-icon-color) group-hover:text-(--fc-breezy-secondary-icon-hover-color)'

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    toolbarClass: `px-4 py-4 items-center ${optionParams.mutedBgClass} gap-4`,
    toolbarSectionClass: 'items-center gap-4',
    toolbarTitleClass: `text-lg font-semibold ${optionParams.textHeaderColorClass}`,

    /*
    TODO: don't make buttons so fat
    are buttons 1px taller than in Tailwind Plus because we're not using inset border?
    */
    buttonGroupClass: (data) => [
      !data.isSelectGroup && `rounded-md shadow-xs`
    ],
    buttonClass: (data) => [
      'py-2 text-sm focus:relative',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.inSelectGroup ? joinClassNames(
        // START view-switching bar item
        'rounded-md font-medium',
        data.isSelected
          ? `${selectBgClass} ${selectTextClass}`
          : `${nonSelectTextClass} ${hoverSelectTextClass}`,
        // END
      ) : joinClassNames(
        'font-semibold',
        data.isPrimary
          // primary
          ? `${optionParams.primaryBgColorClass} ${optionParams.primaryTextColorClass} ${optionParams.primaryBorderColorClass}`
          // secondary
          : secondaryButtonClass,
        data.inGroup
          ? 'first:rounded-s-md first:border-s last:rounded-e-md last:border-e border-y'
          // standalone button (responsible for own border and shadow)
          : 'rounded-md shadow-xs border',
      ),
    ],

    buttons: {
      prev: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? '-rotate-90' : 'rotate-90',
          ),
        ),
      },
      next: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? 'rotate-90' : '-rotate-90',
          ),
        ),
      },
      prevYear: {
        iconContent: (data) => svgs.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' && 'rotate-180',
          )
        )
      },
      nextYear: {
        iconContent: (data) => svgs.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            data.direction !== 'rtl' && 'rotate-180',
          )
        )
      },
    },

    popoverCloseContent: () => svgs.x('size-5'),
  },

  views: baseEventCalendarOptions.views,
}
