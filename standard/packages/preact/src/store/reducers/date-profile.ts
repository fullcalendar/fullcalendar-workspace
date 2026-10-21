import { DateProfile, DateProfileGenerator } from '../../date-profile/DateProfileGenerator'
import { Action } from '../actions'
import { DateMarker } from '@full-ui/headless-calendar'

export function reduceDateProfile(
  currentDateProfile: DateProfile | null,
  action: Action,
  currentDate: DateMarker,
  nowDate: DateMarker,
  dateProfileGenerator: DateProfileGenerator,
): DateProfile {
  let dp: DateProfile

  switch (action.type) {
    case 'CHANGE_VIEW_TYPE':
      return dateProfileGenerator.build(action.dateMarker || currentDate, nowDate)

    case 'CHANGE_DATE':
      return dateProfileGenerator.build(action.dateMarker, nowDate)

    case 'REFRESH_DATE_PROFILE':
      // built by the store's new-day probe, unless options changed the generator since (an option
      // reset queued before this, but applied to the overrides already, during the probe's callbacks)
      return action.dateProfileGenerator === dateProfileGenerator ? action.dateProfile : currentDateProfile

    case 'PREV':
      dp = dateProfileGenerator.buildPrev(currentDateProfile, currentDate, nowDate)
      if (dp.isValid) {
        return dp
      }
      break

    case 'NEXT':
      dp = dateProfileGenerator.buildNext(currentDateProfile, currentDate, nowDate)
      if (dp.isValid) {
        return dp
      }
      break
  }

  return currentDateProfile
}
