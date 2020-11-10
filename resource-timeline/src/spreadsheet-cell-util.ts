import { ViewContext, ViewApi } from '@fullcalendar/common'
import { Resource, ResourceApi } from '@fullcalendar/resource-common'

// hook props
// ----------

export interface HookPropsInput {
  resource: Resource
  fieldValue: any
  context: ViewContext
}

export interface HookProps {
  resource: ResourceApi
  fieldValue: any
  view: ViewApi
}

export function refineHookProps(raw: HookPropsInput): HookProps {
  return {
    resource: new ResourceApi(raw.context, raw.resource),
    fieldValue: raw.fieldValue,
    view: raw.context.viewApi,
  }
}
