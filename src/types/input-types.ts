import * as moment from 'moment'
import { BusinessHoursInput, EventOptionsBase } from 'fullcalendar'

export interface ResourceInput {
  id?: string
  title?: string
  eventColor?: string
  eventBackgroundColor?: string
  eventBorderColor?: string
  eventTextColor?: string
  eventClassName?: string | string[]
  businessHours?: BusinessHoursInput
  children?: ResourceInput[]
  parentId?: string
  parent?: ResourceInput
}

export interface ResourceComplexInput extends EventOptionsBase, JQueryAjaxSettings {
}

export type ResourceFunctionCallback = (resources: ResourceInput[]) => void
export type ResourceFunction = (callback: ResourceFunctionCallback, start: moment.Moment, end: moment.Moment, timezone: string) => void
export type ResourceSourceInput = ResourceInput[] | ResourceFunction | ResourceComplexInput

declare module 'fullcalendar/src/types/input-types' {

  interface DropInfo {
    resourceId?: string
  }

  interface OptionsInputBase {
    schedulerLicenseKey?: string
    resourceAreaWidth?: number
    resourceLabelText?: string
    resourceColumns?: any
    resources?: ResourceSourceInput
    refetchResourcesOnNavigate?: boolean
    groupByResource?: boolean
    groupByDateAndResource?: boolean,
    resourceOrder?: string
    resourceGroupField?: string
    resourceGroupText?: (groupValue: string) => string
    resourcesInitiallyExpanded?: boolean
    filterResourcesWithEvents?: boolean
    resourceText?: (resource: ResourceInput) => string
    resourceRender?: (resource: ResourceInput, labelTds: JQuery, bodyTds: JQuery) => void
    eventResourceEditable?: boolean
  }

}
