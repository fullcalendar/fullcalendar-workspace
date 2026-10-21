import { DateSpan } from '../../events/date-span'
import { Action } from '../actions'

export function reduceDateSelection(currentSelection: DateSpan | null, action: Action) {
  switch (action.type) {
    case 'UNSELECT_DATES':
      return null

    case 'SELECT_DATES':
      return action.selection

    default:
      return currentSelection
  }
}
