import { DateRange } from '@full-ui/headless-calendar'
import { guid } from '../util/misc'

export interface EventInstanceRange extends DateRange {
  timelineStartMs?: number
  timelineEndMs?: number
}

export interface EventInstance {
  instanceId: string
  defId: string
  range: EventInstanceRange
}

export type EventInstanceHash = { [instanceId: string]: EventInstance }

export function createEventInstance(
  defId: string,
  range: EventInstanceRange,
): EventInstance {
  return {
    instanceId: guid(),
    defId,
    range,
  }
}
