import {
  CalendarContext,
  DateComponent,
  DateMarker,
  DateProfile,
  DateProfileGenerator,
  DateRange,
  Hit,
  NowTimer,
  mapHash,
  memoize
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayGridLayout, DayTableSlicer, buildDayTableModel, createDayHeaderFormatter } from '@fullcalendar/daygrid/internal'
import {
  AbstractResourceDayTableModel,
  DEFAULT_RESOURCE_ORDER,
  DayResourceTableModel,
  Resource,
  ResourceDayTableModel,
  ResourceViewProps,
  ResourcelessDayTableModel,
  VResourceSplitter,
  flattenResources,
} from '@fullcalendar/resource/internal'
import { ResourceDayTableJoiner } from '../ResourceDayTableJoiner.js'
import { buildResourceRowConfigs } from '../resource-header-tier.js'

export class ResourceDayGridView extends DateComponent<ResourceViewProps> {
  // memo
  private flattenResources = memoize(flattenResources)
  private buildResourceDayTableModel = memoize(buildResourceDayTableModel)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)
  private buildResourceRowConfigs = memoize(buildResourceRowConfigs)

  private resourceDayTableModel: AbstractResourceDayTableModel
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTableSlicer } = {}
  private joiner = new ResourceDayTableJoiner()

  render() {
    let { props, context } = this
    let { options } = context

    let resourceOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.resourceDayTableModel = this.buildResourceDayTableModel(
      props.dateProfile,
      context.dateProfileGenerator,
      resources,
      options.datesAboveResources,
      context,
    )

    let splitProps = this.splitter.splitProps({
      resourceDayTableModel,
      businessHours: props.businessHours,
      dateSelection: props.dateSelection,
      eventStore: props.eventStore,
      eventUiBases: props.eventUiBases,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
    })
    this.slicers = mapHash(splitProps, (split, resourceId) => this.slicers[resourceId] || new DayTableSlicer())
    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => slicer.sliceProps(
      splitProps[resourceId],
      props.dateProfile,
      options.nextDayThreshold,
      context,
      resourceDayTableModel.dayTableModel,
    ))
    let joinedSlicedProps = this.joiner.joinProps(slicedProps, resourceDayTableModel)

    let datesRepDistinctDays = resourceDayTableModel.dayTableModel.rowCnt === 1
    let dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      datesRepDistinctDays,
      resourceDayTableModel.colCnt,
    )

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const headerTiers = this.buildResourceRowConfigs(
            resources,
            options.datesAboveResources,
            resourceDayTableModel.dayTableModel.headerDates,
            datesRepDistinctDays,
            props.dateProfile,
            todayRange,
            dayHeaderFormat,
            context,
          )

          return (
            <DayGridLayout
              dateProfile={props.dateProfile}
              todayRange={todayRange}
              cellRows={resourceDayTableModel.cells}
              forPrint={props.forPrint}
              isHitComboAllowed={this.isHitComboAllowed}
              className='fc-resource-daygrid-view'

              // header content
              headerTiers={headerTiers}

              // body content
              fgEventSegs={joinedSlicedProps.fgEventSegs}
              bgEventSegs={joinedSlicedProps.bgEventSegs}
              businessHourSegs={joinedSlicedProps.businessHourSegs}
              dateSelectionSegs={joinedSlicedProps.dateSelectionSegs}
              eventDrag={joinedSlicedProps.eventDrag}
              eventResize={joinedSlicedProps.eventResize}
              eventSelection={joinedSlicedProps.eventSelection}
            />
          )
        }}
      </NowTimer>
    )
  }

  isHitComboAllowed = (hit0: Hit, hit1: Hit) => {
    let allowAcrossResources = this.resourceDayTableModel.dayTableModel.colCnt === 1
    return allowAcrossResources || hit0.dateSpan.resourceId === hit1.dateSpan.resourceId
  }
}

function buildResourceDayTableModel(
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  resources: Resource[],
  datesAboveResources: boolean,
  context: CalendarContext,
): AbstractResourceDayTableModel {
  let dayTable = buildDayTableModel(dateProfile, dateProfileGenerator)

  if (!resources.length) {
    return new ResourcelessDayTableModel(dayTable)
  }

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources, context) :
    new ResourceDayTableModel(dayTable, resources, context)
}
