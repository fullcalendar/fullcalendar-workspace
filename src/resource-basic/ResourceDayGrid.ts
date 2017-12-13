import * as $ from 'jquery'
import { DayGrid } from 'fullcalendar'
import { default as ResourceDayTableMixin, ResourceDayTableInterface } from '../component/ResourceDayTableMixin'
import ResourceComponentFootprint from '../models/ResourceComponentFootprint'


export default class ResourceDayGrid extends DayGrid {

  datesAboveResources: ResourceDayTableInterface['datesAboveResources']
  registerResources: ResourceDayTableInterface['registerResources']
  processHeadResourceEls: ResourceDayTableInterface['processHeadResourceEls']
  getColResource: ResourceDayTableInterface['getColResource']
  resourceCnt: ResourceDayTableInterface['resourceCnt']
  indicesToCol: ResourceDayTableInterface['indicesToCol']
  flattenedResources: ResourceDayTableInterface['flattenedResources']

  isResourceFootprintsEnabled: boolean


  constructor(view) {
    super(view)
    this.isResourceFootprintsEnabled = true
  }


  renderDates(dateProfile) {
    this.dateProfile = dateProfile
  }


  renderResources(resources) {
    this.registerResources(resources)
    this.renderGrid()

    if (this.headContainerEl) {
      this.processHeadResourceEls(this.headContainerEl)
    }
  }


  // TODO: make DRY with ResourceTimeGrid
  getHitFootprint(hit) {
    const plainFootprint = super.getHitFootprint(hit)

    return new ResourceComponentFootprint(
      plainFootprint.unzonedRange,
      plainFootprint.isAllDay,
      this.getColResource(hit.col).id
    )
  }


  componentFootprintToSegs(componentFootprint) {
    const { resourceCnt } = this
    const genericSegs = // no assigned resources
      this.datesAboveResources ?
        this.sliceRangeByDay(componentFootprint.unzonedRange) : // each day-per-resource will need its own column
        this.sliceRangeByRow(componentFootprint.unzonedRange)

    const resourceSegs = []

    for (let seg of genericSegs) {

      for (let resourceIndex = 0; resourceIndex < resourceCnt; resourceIndex++) {
        const resourceObj = this.flattenedResources[resourceIndex]

        if (
          !(componentFootprint instanceof ResourceComponentFootprint) ||
          (componentFootprint.resourceId === resourceObj.id)
        ) {
          const copy = $.extend({}, seg)
          copy.resource = resourceObj

          if (this.isRTL) {
            copy.leftCol = this.indicesToCol(resourceIndex, seg.lastRowDayIndex)
            copy.rightCol = this.indicesToCol(resourceIndex, seg.firstRowDayIndex)
          } else {
            copy.leftCol = this.indicesToCol(resourceIndex, seg.firstRowDayIndex)
            copy.rightCol = this.indicesToCol(resourceIndex, seg.lastRowDayIndex)
          }

          resourceSegs.push(copy)
        }
      }
    }

    return resourceSegs
  }
}

ResourceDayTableMixin.mixInto(ResourceDayGrid)
