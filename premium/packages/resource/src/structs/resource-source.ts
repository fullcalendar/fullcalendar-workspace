import { DateRange, CalendarContext } from '@fullcalendar/core/internal'
import { ResourceInput } from './resource.js'

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

export interface RequestFetcherRes {
  rawResources: ResourceInput[]
  response?: Response
}

export type ResourceFetcher<ResourceSourceMeta> = (
  arg: {
    resourceSource: ResourceSource<ResourceSourceMeta>
    range: DateRange | null
    context: CalendarContext
  },
  successCallback: (res: RequestFetcherRes) => void,
  errorCallback: (error: Error) => void,
) => void
