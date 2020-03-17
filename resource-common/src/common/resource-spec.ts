import ResourceApi from '../api/ResourceApi'

// a little bit strange to have references to "columns" here in common


export interface ColSpec {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  width?: number
  field?: string

  headerClassNames?: (() => string[] | string) | string[] | string
  headerContent?: (() => any) | any // TODO: the "any" args are Content
  headerDidMount?: (arg: { el: HTMLElement }) => void
  headerWillUnmount?: (arg: { el: HTMLElement }) => void

  cellClassNames?: (arg: { resource: ResourceApi }) => string[] | string
  cellContent?: (arg: { resource: ResourceApi }) => any // TODO: the "any" args are Content
  cellDidMount?: (arg: { resource: ResourceApi, el: HTMLElement }) => void
  cellWillUnmount?: (arg: { resource: ResourceApi, el: HTMLElement }) => void
}


export interface GroupSpec { // best place for this?
  field?: string
  order?: number

  headerClassNames?: ((groupValue: any) => string[] | string) | string[] | string // TODO: unnecessary OR-ing, but needs to be compat with ColSpec
  headerContent?: ((groupValue: any) => any) | any // TODO: the "any" args are Content. SAME^
  headerDidMount?: (arg: { groupValue: any, el: HTMLElement }) => void
  headerWillUnmount?: (arg: { groupValue: any, el: HTMLElement }) => void

  laneClassNames?: ((groupValue: any) => string[] | string) | string[] | string // TODO: unnecessary OR-ing, but needs to be compat with ColSpec
  laneContent?: ((groupValue: any) => any) | any // TODO: the "any" args are Content. SAME^
  laneDidMount?: (arg: { groupValue: any, el: HTMLElement }) => void
  laneWillUnmount?: (arg: { groupValue: any, el: HTMLElement }) => void
}
