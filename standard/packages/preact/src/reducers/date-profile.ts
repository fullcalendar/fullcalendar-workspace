import { DateProfile, DateProfileGenerator } from '../DateProfileGenerator'
import { Action } from './Action'
import { DateMarker } from '@full-ui/headless-calendar'
import { getDateProfileAnchor } from '../structs/date-profile'

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

    case 'REFRESH_DATE_PROFILE': {
      let anchor = getDateProfileAnchor(currentDateProfile)
      return dateProfileGenerator.build(
        anchor.date,
        nowDate,
        anchor.direction,
        anchor.forceToValid,
        action.untrimmedValidRange,
      )
    }

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
