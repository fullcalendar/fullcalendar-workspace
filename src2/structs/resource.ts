import { refineProps, assignTo, EventStore, parseBusinessHours, Calendar } from 'fullcalendar'

export interface ResourceInput {
  id?: string
  title?: string
  parentId?: string
  children?: ResourceInput[]
  extendedProps?: { [extendedProp: string]: any }
  [otherProp: string]: any
  // TODO: eventprops
}

export interface Resource {
  resourceId: string
  publicId: string
  parentId: string
  title: string
  businessHours: EventStore | null
  extendedProps: { [extendedProp: string]: any }
  // TODO: eventprops
}

export type ResourceHash = { [resourceId: string]: Resource }

const RESOURCE_PROPS = {
  id: String,
  title: String,
  parentId: String,
  businessHours: null,
  children: null
}

let uid = 0

export function parseResource(input: ResourceInput, parentId: string = '', store: ResourceHash = {}, calendar: Calendar): ResourceHash {
  let resourceId = String(uid++)
  let leftovers = {}
  let props = refineProps(input, RESOURCE_PROPS, {}, leftovers)

  if (props.children) {
    for (let childInput of props.children) {
      parseResource(childInput, resourceId, store, calendar)
    }
  }

  props.resourceId = resourceId
  props.parentId = parentId
  props.publicId = props.id
  props.businessHours = props.businessHours ? parseBusinessHours(props.businessHours, calendar) : null
  props.extendedProps = assignTo({}, leftovers, props.extendedProps)

  delete props.id
  delete props.children

  store[resourceId] = props as Resource

  return store
}
