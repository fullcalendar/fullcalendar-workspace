import { CalendarData, OrderSpec, parseFieldSpecs } from '@fullcalendar/core/internal'
import { buildResourceApis, ResourceApi } from './api/ResourceApi.js'
import { ResourceHash } from './structs/resource.js'

export const DEFAULT_RESOURCE_ORDER: OrderSpec<unknown>[] = parseFieldSpecs('id,title')

export interface ResourceAddData {
  resource: ResourceApi
  revert: () => void
}

export interface ResourceChangeData {
  oldResource: ResourceApi
  resource: ResourceApi
  revert: () => void
}

export interface ResourceRemoveData {
  resource: ResourceApi
  revert: () => void
}

export function handleResourceStore(resourceStore: ResourceHash, calendarData: CalendarData) {
  let { emitter } = calendarData

  if (emitter.hasHandlers('resourcesSet')) {
    emitter.trigger('resourcesSet', buildResourceApis(resourceStore, calendarData))
  }
}
