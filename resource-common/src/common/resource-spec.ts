import { ViewApi, ClassNameGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler } from '@fullcalendar/common'
import { ResourceApi } from '../api/ResourceApi'

// strange to reference columns in resource-common

export interface ColHeaderHookProps {
  view: ViewApi
}

export interface ColCellHookProps { // for a group too. make an OR-type?
  resource?: ResourceApi // if a group, won't be for a specific resource
  groupValue?: any
  view: ViewApi
}

export interface ColHeaderRenderHooks {
  headerClassNames?: ClassNameGenerator<ColHeaderHookProps>
  headerContent?: CustomContentGenerator<ColHeaderHookProps>
  headerDidMount?: DidMountHandler<ColHeaderHookProps>
  headerWillUnmount?: WillUnmountHandler<ColHeaderHookProps>
}

export interface ColSpec extends ColHeaderRenderHooks {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  width?: number
  field?: string

  cellClassNames?: ClassNameGenerator<ColCellHookProps>
  cellContent?: CustomContentGenerator<ColCellHookProps>
  cellDidMount?: DidMountHandler<ColCellHookProps>
  cellWillUnmount?: WillUnmountHandler<ColCellHookProps>
}

export interface GroupLaneRenderHooks {
  laneClassNames?: ClassNameGenerator<ColCellHookProps>
  laneContent?: CustomContentGenerator<ColCellHookProps>
  laneDidMount?: DidMountHandler<ColCellHookProps>
  laneWillUnmount?: WillUnmountHandler<ColCellHookProps>
}

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClassNames?: ClassNameGenerator<ColCellHookProps>
  labelContent?: CustomContentGenerator<ColCellHookProps>
  labelDidMount?: DidMountHandler<ColCellHookProps>
  labelWillUnmount?: WillUnmountHandler<ColCellHookProps>
}
