import { SlicedProps, memoize, EventSegUiInteractionState, EventRangeProps } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel'

const NO_SEGS = [] // for memoizing
type AllResourceExpansion = 'all' | 'placeholder' | 'none'

export abstract class VResourceJoiner<R> {
  private joinDateSelection = memoize(this.joinSegs)
  private joinBusinessHours = memoize(this.joinSegs)
  private joinFgEvents = memoize(this.joinSegs)
  private joinBgEvents = memoize(this.joinSegs)
  private joinEventDrags = memoize(this.joinInteractions)
  private joinEventResizes = memoize(this.joinInteractions)

  /*
  propSets also has a '' key for things with no resource
  */
  joinProps(
    propSets: { [resourceId: string]: SlicedProps<R> },
    resourceDayTable: AbstractResourceDayTableModel,
  ): SlicedProps<R> {
    let dateSelectionSets = []
    let businessHoursSets = []
    let fgEventSets = []
    let bgEventSets = []
    let eventDrags = []
    let eventResizes = []
    let eventSelection = ''
    let keys = resourceDayTable.resourceIndex.ids.concat(['']) // add in the all-resource key

    for (let key of keys) {
      let props = propSets[key]

      dateSelectionSets.push(props.dateSelectionSegs)
      businessHoursSets.push(props.businessHourSegs)
      fgEventSets.push(key ? props.fgEventSegs : NO_SEGS) // don't include fg all-resource segs
      bgEventSets.push(props.bgEventSegs)
      eventDrags.push(props.eventDrag)
      eventResizes.push(props.eventResize)
      eventSelection = eventSelection || props.eventSelection
    }

    return {
      dateSelectionSegs: this.joinDateSelection(resourceDayTable, 'all', ...dateSelectionSets),
      businessHourSegs: this.joinBusinessHours(resourceDayTable, 'placeholder', ...businessHoursSets),
      fgEventSegs: this.joinFgEvents(resourceDayTable, 'none', ...fgEventSets),
      bgEventSegs: this.joinBgEvents(resourceDayTable, 'all', ...bgEventSets),
      eventDrag: this.joinEventDrags(resourceDayTable, ...eventDrags),
      eventResize: this.joinEventResizes(resourceDayTable, ...eventResizes),
      eventSelection,
    }
  }

  joinSegs(
    resourceDayTable: AbstractResourceDayTableModel,
    allResourceExpansion: AllResourceExpansion,
    ...segGroups: (R & EventRangeProps)[][]
  ): (R & EventRangeProps)[] {
    let resourceCnt = resourceDayTable.resources.length
    let transformedSegs = []

    for (let i = 0; i < resourceCnt; i += 1) {
      for (let seg of segGroups[i]) {
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, i, false),
        )
      }

      if (allResourceExpansion === 'all') {
        for (let seg of segGroups[resourceCnt]) { // one beyond. the all-resource
          transformedSegs.push(
            ...this.transformSeg(seg, resourceDayTable, i, false),
          )
        }
      }
    }

    if (resourceDayTable.hasPlaceholderCols && allResourceExpansion !== 'none') {
      for (let seg of segGroups[resourceCnt]) {
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, -1, false),
        )
      }
    }

    return transformedSegs
  }

  /*
  for expanding non-resource segs to all resources.
  only for public use.
  no memoizing.
  */
  expandSegs(
    resourceDayTable: AbstractResourceDayTableModel,
    segs: R[], // HACK
  ): (R & EventRangeProps)[] {
    let resourceCnt = resourceDayTable.resources.length
    let transformedSegs = []

    for (let i = 0; i < resourceCnt; i += 1) {
      for (let seg of segs) {
        transformedSegs.push(
          ...this.transformSeg(seg as any, resourceDayTable, i, false), // HACK
        )
      }
    }

    if (resourceDayTable.hasPlaceholderCols) {
      for (let seg of segs) {
        transformedSegs.push(
          ...this.transformSeg(seg as any, resourceDayTable, -1, false), // HACK
        )
      }
    }

    return transformedSegs
  }

  joinInteractions(
    resourceDayTable: AbstractResourceDayTableModel,
    ...interactions: EventSegUiInteractionState<R>[]
  ): EventSegUiInteractionState<R> | null {
    let resourceCnt = resourceDayTable.resources.length
    let affectedInstances = {}
    let transformedSegs = []
    let anyInteractions = false
    let isEvent = false

    for (let i = 0; i < resourceCnt; i += 1) {
      let interaction = interactions[i]

      if (interaction) {
        anyInteractions = true

        for (let seg of interaction.segs) {
          transformedSegs.push(
            ...this.transformSeg(seg, resourceDayTable, i, true), // TODO: templateify Interaction::segs
          )
        }

        Object.assign(affectedInstances, interaction.affectedInstances)
        isEvent = isEvent || interaction.isEvent
      }

    }

    let allResourceInteraction = interactions[resourceCnt] // one beyond. the all-resource

    if (allResourceInteraction) {
      for (let i = 0; i < resourceCnt; i += 1) {
        for (let seg of allResourceInteraction.segs) {
          transformedSegs.push(
            ...this.transformSeg(seg, resourceDayTable, i, false), // TODO: templateify Interaction::segs
          )
        }
      }

      if (resourceDayTable.hasPlaceholderCols) {
        for (let seg of allResourceInteraction.segs) {
          transformedSegs.push(
            ...this.transformSeg(seg, resourceDayTable, -1, false), // TODO: templateify Interaction::segs
          )
        }
      }
    }

    if (anyInteractions) {
      return {
        affectedInstances,
        segs: transformedSegs,
        isEvent,
      }
    }

    return null
  }

  /*
  Needs to generate NEW seg obj!!! because of .el
  Must always forward unknown seg properties!!!
  */
  abstract transformSeg(
    seg: R & EventRangeProps,
    resourceDayTable: AbstractResourceDayTableModel,
    resourceI: number,
    fallbackToPlaceholder: boolean,
  ): (R & EventRangeProps)[]
}
