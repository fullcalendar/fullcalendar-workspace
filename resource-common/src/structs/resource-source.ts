import { DateRange, CalendarContext } from '@fullcalendar/common'
import { ResourceInput } from '../structs/resource'


export interface ResourceSource {
  _raw: any
  sourceId: string
  sourceDefId: number // one of the few IDs that's a NUMBER not a string
  meta: any
  publicId: string
  isFetching: boolean
  latestFetchId: string
  fetchRange: DateRange | null
}

export type ResourceSourceError = { // TODO: converge with EventSourceError
  message: string
  xhr?: XMLHttpRequest
  [otherProp: string]: any
}

export type ResourceFetcher = (
  arg: {
    resourceSource: ResourceSource
    range: DateRange | null
    context: CalendarContext
  },
  success: (res: { rawResources: ResourceInput[], xhr?: XMLHttpRequest }) => void,
  failure: (error: ResourceSourceError) => void
) => void // what about Promise?
