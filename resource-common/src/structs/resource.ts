import {
  ConstraintInput, AllowFunc, EventStore, parseBusinessHours, CalendarContext, EventUi, BusinessHoursInput,
  guid, identity, Identity, RawOptionsFromRefiners, parseClassNames, refineProps, createEventUi, Dictionary,
} from '@fullcalendar/common'

const PRIVATE_ID_PREFIX = '_fc:'

const RESOURCE_REFINERS = {
  id: String,
  parentId: String,
  children: identity as Identity<ResourceInput[]>,
  title: String,
  businessHours: identity as Identity<BusinessHoursInput>,
  extendedProps: identity as Identity<Dictionary>,

  // event-ui
  eventEditable: Boolean,
  eventStartEditable: Boolean,
  eventDurationEditable: Boolean,
  eventConstraint: identity as Identity<ConstraintInput>,
  eventOverlap: Boolean, // can NOT be a func, different from OptionsInput
  eventAllow: identity as Identity<AllowFunc>,
  eventClassNames: parseClassNames,
  eventBackgroundColor: String,
  eventBorderColor: String,
  eventTextColor: String,
  eventColor: String,
}

type BuiltInResourceRefiners = typeof RESOURCE_REFINERS

export interface ResourceRefiners extends BuiltInResourceRefiners {
  // for preventing circular definition. also, good for making ambient in the future
}

export type ResourceInput =
  RawOptionsFromRefiners<Required<ResourceRefiners>> & // Required hack
  { [extendedProps: string]: any }

export interface Resource {
  id: string
  parentId: string
  title: string
  businessHours: EventStore | null // if null, will fall thru to non-resource business hours
  ui: EventUi
  extendedProps: { [extendedProp: string]: any }
}

export type ResourceHash = { [resourceId: string]: Resource }

/*
needs a full store so that it can populate children too
*/
export function parseResource(raw: ResourceInput, parentId: string = '', store: ResourceHash, context: CalendarContext): Resource {
  let { refined, extra } = refineProps(raw, RESOURCE_REFINERS)

  let resource: Resource = {
    id: refined.id || (PRIVATE_ID_PREFIX + guid()),
    parentId: refined.parentId || parentId,
    title: refined.title || '',
    businessHours: refined.businessHours ? parseBusinessHours(refined.businessHours, context) : null,
    ui: createEventUi({
      editable: refined.eventEditable,
      startEditable: refined.eventStartEditable,
      durationEditable: refined.eventDurationEditable,
      constraint: refined.eventConstraint,
      overlap: refined.eventOverlap,
      allow: refined.eventAllow,
      classNames: refined.eventClassNames,
      backgroundColor: refined.eventBackgroundColor,
      borderColor: refined.eventBorderColor,
      textColor: refined.eventTextColor,
      color: refined.eventColor,
    }, context),
    extendedProps: {
      ...extra,
      ...refined.extendedProps,
    },
  }

  // help out ResourceApi from having user modify props
  Object.freeze(resource.ui.classNames)
  Object.freeze(resource.extendedProps)

  if (store[resource.id]) {
    // console.warn('duplicate resource ID')

  } else {
    store[resource.id] = resource

    if (refined.children) {
      for (let childInput of refined.children) {
        parseResource(childInput, resource.id, store, context)
      }
    }
  }

  return resource
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
