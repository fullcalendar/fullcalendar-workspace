import { ConstraintInput, AllowFunc, refineProps, EventStore, parseBusinessHours, CalendarContext, EventUi, BusinessHoursInput, guid, processUiProps, EVENT_SCOPED_RAW_UI_PROPS } from '@fullcalendar/common'

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
  extendedProps: null,
  ...EVENT_SCOPED_RAW_UI_PROPS
}

const PRIVATE_ID_PREFIX = '_fc:'

/*
needs a full store so that it can populate children too
*/
export function parseResource(input: ResourceInput, parentId: string = '', store: ResourceHash, context: CalendarContext): Resource {
  let leftovers = {}
  let props = refineProps(input, RESOURCE_PROPS, {}, leftovers)
  let ui = processUiProps({
    display: props.eventDisplay,
    editable: props.editable, // without "event" at start
    startEditable: props.eventStartEditable,
    durationEditable: props.eventDurationEditable,
    constraint: props.eventConstraint,
    overlap: props.eventOverlap,
    allow: props.eventAllow,
    backgroundColor: props.eventBackgroundColor,
    borderColor: props.eventBorderColor,
    textColor: props.eventTextColor,
    classNames: props.eventClassNames
  }, context)

  if (!props.id) {
    props.id = PRIVATE_ID_PREFIX + guid()
  }

  if (!props.parentId) { // give precedence to the parentId property
    props.parentId = parentId
  }

  props.businessHours = props.businessHours ? parseBusinessHours(props.businessHours, context) : null
  props.ui = ui
  props.extendedProps = { ...leftovers, ...props.extendedProps }

  // help out ResourceApi from having user modify props
  Object.freeze(ui.classNames)
  Object.freeze(props.extendedProps)

  if (store[props.id]) {
    // console.warn('duplicate resource ID')

  } else {
    store[props.id] = props as Resource

    if (props.children) {

      for (let childInput of props.children) {
        parseResource(childInput, props.id, store, context)
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
