import { CalendarData } from './data-types'
import { Effect } from './effects'

// an option's change handler (`optionChangeHandlers`), run at the late stage's checkpoint
export interface OptionChangeEffect extends Effect {
  type: 'optionChange'
  optionName: string
  optionValue: any
  data: CalendarData // the new data. getCurrentData() still returns the previous
}

export function runOptionChange(effect: OptionChangeEffect): void {
  effect.data.pluginHooks.optionChangeHandlers[effect.optionName](effect.optionValue, effect.data)
}
