import { ViewApi, ClassNamesGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler, MountArg } from '@fullcalendar/common'
import { ResourceApi } from '../api/ResourceApi'

// strange to reference columns in resource-common

export interface ColHeaderContentArg {
  view: ViewApi
}

export type ColHeaderMountArg = MountArg<ColHeaderContentArg>

export interface ColCellContentArg { // for a group too. make an OR-type?
  resource?: ResourceApi // if a group, won't be for a specific resource
  groupValue?: any
  view: ViewApi
}

export type ColCellMountArg = MountArg<ColCellContentArg>

export interface ColHeaderRenderHooks {
  headerClassNames?: ClassNamesGenerator<ColHeaderContentArg>
  headerContent?: CustomContentGenerator<ColHeaderContentArg>
  headerDidMount?: DidMountHandler<ColHeaderMountArg>
  headerWillUnmount?: WillUnmountHandler<ColHeaderMountArg>
}

export interface ColSpec extends ColHeaderRenderHooks {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  width?: number
  field?: string

  cellClassNames?: ClassNamesGenerator<ColCellContentArg>
  cellContent?: CustomContentGenerator<ColCellContentArg>
  cellDidMount?: DidMountHandler<ColCellMountArg>
  cellWillUnmount?: WillUnmountHandler<ColCellMountArg>
}

export interface GroupLaneRenderHooks {
  laneClassNames?: ClassNamesGenerator<ColCellContentArg>
  laneContent?: CustomContentGenerator<ColCellContentArg>
  laneDidMount?: DidMountHandler<ColCellMountArg>
  laneWillUnmount?: WillUnmountHandler<ColCellMountArg>
}

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClassNames?: ClassNamesGenerator<ColCellContentArg>
  labelContent?: CustomContentGenerator<ColCellContentArg>
  labelDidMount?: DidMountHandler<ColCellMountArg>
  labelWillUnmount?: WillUnmountHandler<ColCellMountArg>
}
