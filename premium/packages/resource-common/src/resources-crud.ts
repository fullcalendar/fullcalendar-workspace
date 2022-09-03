import { CalendarData, parseFieldSpecs } from '@fullcalendar/common'
import { buildResourceApis, ResourceApi } from './api/ResourceApi'
import { ResourceHash } from './structs/resource'

export const DEFAULT_RESOURCE_ORDER = parseFieldSpecs('id,title')

export interface ResourceAddArg {
  resource: ResourceApi
  revert: () => void
}

export interface ResourceChangeArg {
  oldResource: ResourceApi
  resource: ResourceApi
  revert: () => void
}

export interface ResourceRemoveArg {
  resource: ResourceApi
  revert: () => void
}

export function handleResourceStore(resourceStore: ResourceHash, calendarData: CalendarData) {
  let { emitter } = calendarData

  if (emitter.hasHandlers('resourcesSet')) {
    emitter.trigger('resourcesSet', buildResourceApis(resourceStore, calendarData))
  }
}
