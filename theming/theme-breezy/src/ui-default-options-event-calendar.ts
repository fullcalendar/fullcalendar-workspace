import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

// TODO: rename to tab stuff
const selectBgClass = 'bg-(--fc-breezy-tab-selected)'
const selectTextClass = 'text-(--fc-breezy-tab-selected-foreground)'
const nonSelectTextClass = 'text-(--fc-breezy-tab-foreground)'
const hoverSelectTextClass = 'hover:text-(--fc-breezy-tab-selected-foreground)' // best name?

export const optionParams: EventCalendarOptionParams = {
  // always considered a button, and has hover effect. okay?
  primaryBgColorClass: 'bg-(--fc-breezy-primary) hover:bg-(--fc-breezy-primary-hover)',
  primaryTextColorClass: 'text-(--fc-breezy-primary-foreground)',
  primaryBorderColorClass: 'border-(--fc-breezy-primary) hover:border-(--fc-breezy-primary-hover)',
  // weird we need to do this border stuff too!!!

  eventColor: 'var(--fc-breezy-event)',
  backgroundEventColor: 'var(--fc-breezy-background-event)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'bg-(--fc-breezy-popover) border border-(--fc-breezy-popover-border) rounded-lg shadow-lg',

  bgColorClass: 'bg-(--fc-breezy-background)',
  bgColorOutlineClass: 'outline-(--fc-breezy-background)',

  borderLowColorClass: 'border-(--fc-breezy-muted-border)',
  borderMidColorClass: 'border-(--fc-breezy-border)',
  borderStartMedColorClass: 'border-s-(--fc-breezy-border)',
  borderHighColorClass: 'border-(--fc-breezy-strong-border)',
  borderBottomHighColorClass: 'border-b-(--fc-breezy-strong-border)',

  mutedBgClass: 'bg-(--fc-breezy-muted)',
  neutralBgClass: 'bg-(--fc-breezy-strong)',
  highlightClass: 'bg-(--fc-breezy-highlight)',

  // TODO: use glassy + cloudy
  ghostButtonClass: 'hover:bg-gray-500/20 focus-visible:bg-gray-500/30',

  textLowColorClass: 'text-(--fc-breezy-faint-foreground)',
  textMidColorClass: 'text-(--fc-breezy-muted-foreground)',
  textHighColorClass: 'text-(--fc-breezy-foreground)',
  textHeaderColorClass: 'text-(--fc-breezy-strong-foreground)',

  nowIndicatorBorderColorClass: 'border-(--fc-breezy-now)',
}

const secondaryButtonClass = 'group text-(--fc-breezy-secondary-foreground) bg-(--fc-breezy-secondary) hover:bg-(--fc-breezy-secondary-hover) border-(--fc-breezy-secondary-border)'

// NOTE: only works within secondary button
// best? to sync to line-height???
const buttonIconClass = 'size-5 text-(--fc-breezy-secondary-icon) group-hover:text-(--fc-breezy-secondary-icon-hover)'

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgColorClass} border ${optionParams.borderMidColorClass} rounded-lg overflow-hidden`,
    headerToolbarClass: `border-b ${optionParams.borderMidColorClass}`,
    footerToolbarClass: `border-t ${optionParams.borderMidColorClass}`,

    toolbarClass: `px-4 py-4 items-center ${optionParams.mutedBgClass} gap-4`,
    toolbarSectionClass: 'items-center gap-4',
    toolbarTitleClass: `text-lg font-semibold ${optionParams.textHeaderColorClass}`,

    /*
    TODO: don't make buttons so fat
    are buttons 1px taller than in Tailwind Plus because we're not using inset border?
    */
    buttonGroupClass: (data) => [
      'isolate',
      !data.isSelectGroup && `rounded-md shadow-xs`
    ],
    buttonClass: (data) => [
      'py-2 text-sm',
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
          ? 'first:rounded-s-md first:border-s last:rounded-e-md last:border-e border-y focus-visible:z-10'
          // standalone button (responsible for own border and shadow)
          : 'rounded-md shadow-xs border',
      ),
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(buttonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        ),
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(buttonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        ),
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

    popoverCloseContent: () => svgs.x(`size-5 ${optionParams.textHighColorClass}`),
  },

  views: baseEventCalendarOptions.views,
}
