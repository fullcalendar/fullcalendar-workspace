import { DateRange, CalendarContext } from '@fullcalendar/common'
import { ResourceInput } from './resource'

export interface ResourceSource<ResourceSourceMeta> {
  _raw: any
  sourceId: string
  sourceDefId: number // one of the few IDs that's a NUMBER not a string
  meta: ResourceSourceMeta
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

export type ResourceFetcher<ResourceSourceMeta> = (
  arg: {
    resourceSource: ResourceSource<ResourceSourceMeta>
    range: DateRange | null
    context: CalendarContext
  },
  success: (res: { rawResources: ResourceInput[], xhr?: XMLHttpRequest }) => void,
  failure: (error: ResourceSourceError) => void
) => void // what about Promise?
