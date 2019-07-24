import { ConstraintInput, AllowFunc, refineProps, EventStore, parseBusinessHours, Calendar, EventUi, processScopedUiProps, BusinessHoursInput } from '@fullcalendar/core'

export interface ResourceInput {
  id?: string
  parentId?: string
  children?: ResourceInput[]
  title?: string
  businessHours?: BusinessHoursInput

  eventEditable?: boolean
  eventStartEditable?: boolean
  eventDurationEditable?: boolean
  eventConstraint?: ConstraintInput
  eventOverlap?: boolean
  eventAllow?: AllowFunc
  eventClassName?: string[] | string
  eventClassNames?: string[] | string
  eventBackgroundColor?: string
  eventBorderColor?: string
  eventTextColor?: string
  eventColor?: string

  extendedProps?: { [extendedProp: string]: any }
  [otherProp: string]: any
}

export interface Resource {
  id: string
  parentId: string
  title: string
  businessHours: EventStore | null
  ui: EventUi
  extendedProps: { [extendedProp: string]: any }
}

export type ResourceHash = { [resourceId: string]: Resource }

const RESOURCE_PROPS = {
  id: String,
  title: String,
  parentId: String,
  businessHours: null,
  children: null,
  extendedProps: null
}

const PRIVATE_ID_PREFIX = '_fc:'
let uid = 0

/*
needs a full store so that it can populate children too
*/
export function parseResource(input: ResourceInput, parentId: string = '', store: ResourceHash, calendar: Calendar): Resource {
  let leftovers0 = {}
  let props = refineProps(input, RESOURCE_PROPS, {}, leftovers0)
  let leftovers1 = {}
  let ui = processScopedUiProps('event', leftovers0, calendar, leftovers1)

  if (!props.id) {
    props.id = PRIVATE_ID_PREFIX + (uid++)
  }

  if (!props.parentId) { // give precedence to the parentId property
    props.parentId = parentId
  }

  props.businessHours = props.businessHours ? parseBusinessHours(props.businessHours, calendar) : null
  props.ui = ui
  props.extendedProps = { ...leftovers1, ...props.extendedProps }

  // help out ResourceApi from having user modify props
  Object.freeze(ui.classNames)
  Object.freeze(props.extendedProps)

  if (store[props.id]) {
    // console.warn('duplicate resource ID')

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
