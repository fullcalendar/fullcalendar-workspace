import { CalendarData, OrderSpec, parseFieldSpecs } from '@fullcalendar/preact/protected-api'
import { buildResourceApis, ResourceApi } from './api/ResourceApi'
import { ResourceHash } from './structs/resource'

export const DEFAULT_RESOURCE_ORDER: OrderSpec<unknown>[] = parseFieldSpecs('id,title')

export interface ResourceAddInfo {
  resource: ResourceApi
  revert: () => void
}

export interface ResourceChangeInfo {
  oldResource: ResourceApi
  resource: ResourceApi
  revert: () => void
}

export interface ResourceRemoveInfo {
  resource: ResourceApi
  revert: () => void
}

export function handleResourceStore(resourceStore: ResourceHash, calendarData: CalendarData) {
  let { emitter } = calendarData

  if (emitter.hasHandlers('resourcesSet')) {
    emitter.trigger('resourcesSet', buildResourceApis(resourceStore, calendarData))
  }
}
