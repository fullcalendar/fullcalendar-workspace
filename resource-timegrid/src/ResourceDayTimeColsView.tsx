import { ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile } from '@fullcalendar/core'
import { TimeColsView, buildDayTableModel as buildAgendaDayTableModel } from '@fullcalendar/timegrid'
import { ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import { ResourceDayTable } from '@fullcalendar/resource-daygrid'
import ResourceDayTimeCols from './ResourceDayTimeCols'
import { h, createRef } from 'preact'


export default class ResourceDayTimeColsView extends TimeColsView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private flattenResources = memoize(flattenResources)
  private buildResourceDayTableModel = memoize(buildResourceDayTableModel)
  private parseResourceOrder = memoize(parseFieldSpecs)
  private dayTableRef = createRef<ResourceDayTable>()
  private timeColsRef = createRef<ResourceDayTimeCols>()


  render(props: ResourceViewProps, state: {}, context: ComponentContext) {
    let { options, nextDayThreshold } = context

    let splitProps = this.allDaySplitter.splitProps(props)
    let resourceOrderSpecs = this.parseResourceOrder(options.resourceOrder)
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceDayTableModel(
      props.dateProfile,
      props.dateProfileGenerator,
      resources,
      options.datesAboveResources
    )

    return this.renderLayout(
      options.columnHeader &&
        <ResourceDayHeader
          resources={resources}
          dates={resourceDayTableModel.dayTableModel.headerDates}
          dateProfile={props.dateProfile}
          datesRepDistinctDays={true}
          renderIntro={this.renderHeadIntro}
        />,
      options.allDaySlot &&
        <ResourceDayTable
          ref={this.dayTableRef}
          {...splitProps['allDay']}
          dateProfile={props.dateProfile}
          resourceDayTableModel={resourceDayTableModel}
          isRigid={false}
          nextDayThreshold={nextDayThreshold}
          renderNumberIntro={this.renderTableIntro}
          renderBgIntro={this.renderTableBgIntro}
          renderIntro={this.renderTableIntro}
          colWeekNumbersVisible={false}
          cellWeekNumbersVisible={false}
        />,
      <ResourceDayTimeCols
        ref={this.timeColsRef}
        {...splitProps['timed']}
        dateProfile={props.dateProfile}
        resourceDayTableModel={resourceDayTableModel}
        renderBgIntro={this.renderTimeColsBgIntro}
        renderIntro={this.renderTimeColsIntro}
      />
    )
  }


  updateSize(isResize: boolean, viewHeight: number, isAuto: boolean) {
    let dayTable = this.dayTableRef.current
    let timeCols = this.timeColsRef.current

    if (isResize || this.isLayoutSizeDirty()) {
      this.updateLayoutSize(
        timeCols.timeCols,
        dayTable ? dayTable.table : null,
        viewHeight,
        isAuto
      )
    }

    if (dayTable) {
      dayTable.updateSize(isResize)
    }

    timeCols.updateSize(isResize)
  }


  getAllDayTableObj() {
    return this.dayTableRef.current
  }


  getTimeColsObj() {
    return this.timeColsRef.current
  }

}


function buildResourceDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildAgendaDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources) :
    new ResourceDayTableModel(dayTable, resources)
}
