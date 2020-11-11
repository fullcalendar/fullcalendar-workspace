import { SlicedProps, Seg, memoize, EventSegUiInteractionState } from '@fullcalendar/common'
import { __assign } from 'tslib'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel'

const NO_SEGS = [] // for memoizing

export abstract class VResourceJoiner<SegType extends Seg> {
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
    propSets: { [resourceId: string]: SlicedProps<SegType> },
    resourceDayTable: AbstractResourceDayTableModel,
  ): SlicedProps<SegType> {
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
      businessHoursSets.push(key ? props.businessHourSegs : NO_SEGS) // don't include redundant all-resource businesshours
      fgEventSets.push(key ? props.fgEventSegs : NO_SEGS) // don't include fg all-resource segs
      bgEventSets.push(props.bgEventSegs)
      eventDrags.push(props.eventDrag)
      eventResizes.push(props.eventResize)
      eventSelection = eventSelection || props.eventSelection
    }

    return {
      dateSelectionSegs: this.joinDateSelection(resourceDayTable, ...dateSelectionSets),
      businessHourSegs: this.joinBusinessHours(resourceDayTable, ...businessHoursSets),
      fgEventSegs: this.joinFgEvents(resourceDayTable, ...fgEventSets),
      bgEventSegs: this.joinBgEvents(resourceDayTable, ...bgEventSets),
      eventDrag: this.joinEventDrags(resourceDayTable, ...eventDrags),
      eventResize: this.joinEventResizes(resourceDayTable, ...eventResizes),
      eventSelection,
    }
  }

  joinSegs(resourceDayTable: AbstractResourceDayTableModel, ...segGroups: SegType[][]): SegType[] {
    let resourceCnt = resourceDayTable.resources.length
    let transformedSegs = []

    for (let i = 0; i < resourceCnt; i += 1) {
      for (let seg of segGroups[i]) {
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, i),
        )
      }

      for (let seg of segGroups[resourceCnt]) { // one beyond. the all-resource
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, i),
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
  expandSegs(resourceDayTable: AbstractResourceDayTableModel, segs: SegType[]) {
    let resourceCnt = resourceDayTable.resources.length
    let transformedSegs = []

    for (let i = 0; i < resourceCnt; i += 1) {
      for (let seg of segs) {
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, i),
        )
      }
    }

    return transformedSegs
  }

  joinInteractions(
    resourceDayTable: AbstractResourceDayTableModel,
    ...interactions: EventSegUiInteractionState[]
  ): EventSegUiInteractionState | null {
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
            ...this.transformSeg(seg as SegType, resourceDayTable, i), // TODO: templateify Interaction::segs
          )
        }

        __assign(affectedInstances, interaction.affectedInstances)
        isEvent = isEvent || interaction.isEvent
      }

      if (interactions[resourceCnt]) { // one beyond. the all-resource
        for (let seg of interactions[resourceCnt].segs) {
          transformedSegs.push(
            ...this.transformSeg(seg as SegType, resourceDayTable, i), // TODO: templateify Interaction::segs
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

  // needs to generate NEW seg obj!!! because of .el
  abstract transformSeg(seg: SegType, resourceDayTable: AbstractResourceDayTableModel, resourceI: number): SegType[]
}
