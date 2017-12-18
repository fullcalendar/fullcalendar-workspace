import { BusinessHoursInput } from 'fullcalendar'

declare module 'fullcalendar/src/types/input-types' {

  interface DropInfo {
    resourceId?: string
  }

  interface OptionsInputBase {
    resourceAreaWidth?: number
    schedulerLicenseKey?: string
    resourceLabelText?: any
    resourceColumns?: any
  }

}

export interface ResourceInput {
  id?: string
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
