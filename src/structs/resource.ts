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
  id: string
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

const PRIVATE_ID_PREFIX = '_fc:'
let uid = 0

/*
needs a full store so that it can populate children too
*/
export function parseResource(input: ResourceInput, parentId: string = '', store: ResourceHash, calendar: Calendar): Resource {
  let leftovers = {}
  let props = refineProps(input, RESOURCE_PROPS, {}, leftovers)

  if (!props.id) {
    props.id = PRIVATE_ID_PREFIX + (uid++)
  }

  props.parentId = parentId
  props.businessHours = props.businessHours ? parseBusinessHours(props.businessHours, calendar) : null
  props.extendedProps = assignTo({}, leftovers, props.extendedProps)

  if (store[props.id]) {
    console.warn('duplicate resource ID')

  } else {
    store[props.id] = props as Resource

    if (props.children) {

      for (let childInput of props.children) {
        parseResource(childInput, props.id, store, calendar)
      }

      delete props.children
    }
  }

  return props as Resource
}


/*
TODO: use this in more places
*/
export function getPublicId(id: string): string {
 if (id.indexOf(PRIVATE_ID_PREFIX) === 0) {
   return ''
 }

 return id
}
