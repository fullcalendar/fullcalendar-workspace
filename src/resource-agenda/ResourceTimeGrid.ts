import { assignTo, TimeGrid } from 'fullcalendar'
import { default as ResourceDayTableMixin, ResourceDayTableInterface } from '../component/ResourceDayTableMixin'
import ResourceComponentFootprint from '../models/ResourceComponentFootprint'


export default class ResourceTimeGrid extends TimeGrid {

  registerResources: ResourceDayTableInterface['registerResources']
  processHeadResourceEls: ResourceDayTableInterface['processHeadResourceEls']
  getColResource: ResourceDayTableInterface['getColResource']
  resourceCnt: ResourceDayTableInterface['resourceCnt']
  indicesToCol: ResourceDayTableInterface['indicesToCol']
  flattenedResources: ResourceDayTableInterface['flattenedResources']

  isResourceFootprintsEnabled: boolean // configuration for DateComponent monkeypatch


  constructor(view) {
    super(view)
    this.isResourceFootprintsEnabled = true
  }


  renderDates() {
    this.renderSlats()
  }


  renderResources(resources) {
    this.registerResources(resources)
    this.renderColumns()

    if (this.headContainerEl) {
      this.processHeadResourceEls(this.headContainerEl)
    }
  }


  // TODO: make DRY with ResourceDayGrid
  getHitFootprint(hit) {
    const plainFootprint = super.getHitFootprint(hit)

    return new ResourceComponentFootprint(
      plainFootprint.unzonedRange,
      plainFootprint.allDay,
      this.getColResource(hit.col).id
    )
  }


  componentFootprintToSegs(componentFootprint) {
    const { resourceCnt } = this
    const genericSegs = this.sliceRangeByTimes(componentFootprint.unzonedRange) // no assigned resources
    const resourceSegs = []

    for (let seg of genericSegs) {

      for (let resourceIndex = 0; resourceIndex < resourceCnt; resourceIndex++) {
        const resourceObj = this.flattenedResources[resourceIndex]

        if (
          !(componentFootprint instanceof ResourceComponentFootprint) ||
          (componentFootprint.resourceId === resourceObj.id)
        ) {
          const copy = assignTo({}, seg)
          copy.resource = resourceObj
          copy.col = this.indicesToCol(resourceIndex, seg.dayIndex)
          resourceSegs.push(copy)
        }
      }
    }

    return resourceSegs
  }
}

ResourceDayTableMixin.mixInto(ResourceTimeGrid)
