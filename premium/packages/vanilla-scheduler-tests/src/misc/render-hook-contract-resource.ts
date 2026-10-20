import { describeRenderHookContract, RenderHookArea } from '@fullcalendar-tests/standard/lib/render-hook-contract'

/*
The user-visible contract of every render-hook area in the resource views.
See @fullcalendar-tests/standard/lib/render-hook-contract.ts
*/

const DATE = '2024-01-17'

const BASE_OPTIONS = {
  initialDate: DATE,
  now: `${DATE}T10:15:00`,
  timeZone: 'UTC',
  scrollTime: '08:00',
  resources: [
    { id: 'a', title: 'Room A', building: 'North' },
    { id: 'b', title: 'Room B', building: 'South', children: [{ id: 'b1', title: 'Room B1', building: 'South' }] },
  ],
}

const AREAS: RenderHookArea[] = [
  {
    name: 'resourceCell',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay' },
    classOption: 'resourceCellClass',
    contentOption: 'resourceCellContent',
    hasDefaultContent: true,
    didMountOption: 'resourceCellDidMount',
    willUnmountOption: 'resourceCellWillUnmount',
    infoKeys: ['resource', 'fieldValue'],
  },
  {
    name: 'resourceColumnHeader',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay' },
    classOption: 'resourceColumnHeaderClass',
    contentOption: 'resourceColumnHeaderContent',
    hasDefaultContent: true,
    didMountOption: 'resourceColumnHeaderDidMount',
    willUnmountOption: 'resourceColumnHeaderWillUnmount',
    infoKeys: ['view'],
  },
  {
    name: 'resourceDayHeader',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimeGridDay' },
    classOption: 'resourceDayHeaderClass',
    contentOption: 'resourceDayHeaderContent',
    hasDefaultContent: true,
    didMountOption: 'resourceDayHeaderDidMount',
    willUnmountOption: 'resourceDayHeaderWillUnmount',
    infoKeys: ['resource', 'text', 'view'],
  },
  {
    name: 'resourceGroupHeader',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay', resourceGroupField: 'building' },
    classOption: 'resourceGroupHeaderClass',
    contentOption: 'resourceGroupHeaderContent',
    hasDefaultContent: true,
    didMountOption: 'resourceGroupHeaderDidMount',
    willUnmountOption: 'resourceGroupHeaderWillUnmount',
    infoKeys: ['fieldValue', 'view'],
  },
  {
    name: 'resourceGroupLane',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay', resourceGroupField: 'building' },
    classOption: 'resourceGroupLaneClass',
    contentOption: 'resourceGroupLaneContent',
    didMountOption: 'resourceGroupLaneDidMount',
    willUnmountOption: 'resourceGroupLaneWillUnmount',
    infoKeys: ['fieldValue', 'view'],
  },
  {
    name: 'resourceLane',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay' },
    classOption: 'resourceLaneClass',
    didMountOption: 'resourceLaneDidMount',
    willUnmountOption: 'resourceLaneWillUnmount',
    infoKeys: ['resource', 'options'],
  },
  {
    name: 'resourceLaneTop',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay' },
    classOption: 'resourceLaneTopClass',
    contentOption: 'resourceLaneTopContent',
    infoKeys: ['resource'],
  },
  {
    name: 'resourceLaneBottom',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay' },
    classOption: 'resourceLaneBottomClass',
    contentOption: 'resourceLaneBottomContent',
    infoKeys: ['resource'],
  },
  {
    name: 'resourceExpander',
    options: { ...BASE_OPTIONS, initialView: 'resourceTimelineDay' },
    classOption: 'resourceExpanderClass',
    contentOption: 'resourceExpanderContent',
    hasDefaultContent: true,
    infoKeys: ['isExpanded'],
  },
]

for (const area of AREAS) {
  describeRenderHookContract(area)
}
