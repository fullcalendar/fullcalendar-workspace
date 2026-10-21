import { DateMarker, rangeContainsMarker } from '@full-ui/headless-calendar'
import { DateProfile, DateProfileGenerator } from '../date-profile/DateProfileGenerator'
import { ViewSpec } from '../views/view-spec'
import { CalendarToolbarProps } from '../store/data-types'

// the toolbar's title and button states, for the current view and dates
export function buildToolbarProps(
  viewSpec: ViewSpec,
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  currentDate: DateMarker,
  nowDate: DateMarker,
  title: string,
): CalendarToolbarProps {
  // don't force any date-profiles to valid date profiles (the `false`) so that we can tell if it's invalid
  let todayInfo = dateProfileGenerator.build(nowDate, nowDate, undefined, /* forceToValid = */ false)
  let prevInfo = dateProfileGenerator.buildPrev(dateProfile, currentDate, nowDate, /* forceToValid = */ false)
  let nextInfo = dateProfileGenerator.buildNext(dateProfile, currentDate, nowDate, /* forceToValid = */ false)

  return {
    title,
    selectedButton: viewSpec.type,
    navUnit: viewSpec.singleUnit,
    isTodayEnabled: todayInfo.isValid && !rangeContainsMarker(dateProfile.currentRange, nowDate),
    isPrevEnabled: prevInfo.isValid,
    isNextEnabled: nextInfo.isValid,
  }
}
