import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

/*
We don't do active: states, because tailwindplus does not do this!
*/

const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'

const primaryOutlineColorClass = `outline-(--fc-breezy-primary)`
const primaryOutlineFocusClass = `${primaryOutlineColorClass} ${outlineWidthFocusClass}`

// no simulated hover-effect when focus-visible,
// because focus-border looks like when same primary color because its spaced away
const primaryClass = 'bg-(--fc-breezy-primary) text-(--fc-breezy-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-breezy-primary-hover) ${primaryOutlineFocusClass} ${outlineOffsetClass}`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-(--fc-breezy-primary-hover)`
const primaryButtonClass = `${primaryPressableClass} border-transparent`

const secondaryClass = 'text-(--fc-breezy-secondary-foreground) bg-(--fc-breezy-secondary)'
const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-breezy-secondary-hover) ${primaryOutlineFocusClass} -outline-offset-1`
const secondaryButtonClass = `${secondaryPressableClass} border-(--fc-breezy-secondary-border)`

const ghostHoverClass = 'hover:bg-(--fc-breezy-muted)'
const ghostPressableClass = `${ghostHoverClass} focus-visible:bg-(--fc-breezy-muted) ${primaryOutlineFocusClass}`

// NOTE: only works within secondary button
// best? to sync to line-height???
const buttonIconClass = 'size-5 text-(--fc-breezy-secondary-icon) group-hover:text-(--fc-breezy-secondary-icon-hover)'

// TODO: rename to tab stuff
const selectBgClass = 'bg-(--fc-breezy-tab-selected)'
const selectTextClass = 'text-(--fc-breezy-tab-selected-foreground)'
const selectClass = `${selectBgClass} ${selectTextClass} ${primaryOutlineFocusClass}`

const nonSelectTextClass = 'text-(--fc-breezy-tab-foreground)'
const hoverSelectTextClass = 'hover:text-(--fc-breezy-tab-selected-foreground)' // best name?
const nonSelectClass = `${nonSelectTextClass} ${hoverSelectTextClass} ${primaryOutlineFocusClass}`

export const optionParams: EventCalendarOptionParams = {
  primaryClass,
  primaryPressableClass,
  primaryPressableGroupClass,

  ghostHoverClass,
  ghostPressableClass,

  primaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineOffsetClass,
  outlineInsetClass,

  strongPressableClass: 'bg-(--fc-breezy-strong)',

  mutedBgClass: 'bg-(--fc-breezy-muted)',
  faintBgClass: 'bg-(--fc-breezy-faint)',
  highlightClass: 'bg-(--fc-breezy-highlight)',

  eventColor: 'var(--fc-breezy-event)',
  bgEventColor: 'var(--fc-breezy-background-event)',
  bgEventColorClass: 'brightness-150 opacity-15',

  borderColorClass: 'border-(--fc-breezy-border)',
  borderStartColorClass: 'border-s-(--fc-breezy-border)',
  primaryBorderColorClass: 'border-(--fc-breezy-primary)',
  strongBorderColorClass: 'border-(--fc-breezy-strong-border)',
  strongBorderBottomColorClass: 'border-b-(--fc-breezy-strong-border)',
  mutedBorderColorClass: 'border-(--fc-breezy-muted-border)',
  nowBorderColorClass: 'border-(--fc-breezy-now)',

  popoverClass: 'bg-(--fc-breezy-popover) border border-(--fc-breezy-popover-border) rounded-lg shadow-lg',

  bgClass: 'bg-(--fc-breezy-background)',
  bgRingColorClass: 'ring-(--fc-breezy-background)',

  faintFgClass: 'text-(--fc-breezy-faint-foreground)',
  mutedFgClass: 'text-(--fc-breezy-muted-foreground)',
  fgClass: 'text-(--fc-breezy-foreground)',
  strongFgClass: 'text-(--fc-breezy-strong-foreground)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgClass} border ${optionParams.borderColorClass} rounded-lg overflow-hidden`,
    headerToolbarClass: `border-b ${optionParams.borderColorClass}`,
    footerToolbarClass: `border-t ${optionParams.borderColorClass}`,

    toolbarClass: `px-4 py-4 items-center ${optionParams.faintBgClass} gap-4`,
    toolbarSectionClass: 'items-center gap-4',
    toolbarTitleClass: `text-lg font-semibold ${optionParams.strongFgClass}`,

    /*
    TODO: don't make buttons so fat
    are buttons 1px taller than in Tailwind Plus because we're not using inset border?
    */
    buttonGroupClass: (data) => [
      'isolate',
      !data.isSelectGroup && `rounded-md shadow-xs`
    ],
    buttonClass: (data) => [
      'py-2 text-sm group', // group for icon group-focus
      data.isIconOnly ? 'px-2' : 'px-3',
      data.inSelectGroup ? joinClassNames(
        // START view-switching bar item
        'rounded-md font-medium',
        data.isSelected
          ? selectClass
          : nonSelectClass,
        // END
      ) : joinClassNames(
        'font-semibold',
        data.isPrimary
          ? primaryButtonClass
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

    popoverCloseContent: () => svgs.x(`size-5 ${optionParams.fgClass}`),
  },

  views: baseEventCalendarOptions.views,
}
