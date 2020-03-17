import ResourceApi from '../api/ResourceApi'

// a little bit strange to have references to "columns" here in common


export type ColSpecRenderFunc = (arg: { value: any, resource: ResourceApi, el: HTMLElement }) => void


export interface ColSpec {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  labelText: string // must be defined for horizontal groups
  width?: number
  field?: string
  render?: ColSpecRenderFunc
}


export interface GroupSpec { // best place for this?
  field?: string
  order?: number
  render?: ColSpecRenderFunc
}
