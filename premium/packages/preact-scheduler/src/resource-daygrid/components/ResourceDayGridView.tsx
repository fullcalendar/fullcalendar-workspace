import {
  CalendarContext,
  DateComponent,
  DayCol,
  DateMarker,
  DateRange,
  DayTableModel,
  EventStore,
  Hit,
  NowTimer,
  addDays,
  mapHash,
  memoize,
} from '@fullcalendar/preact/protected-api'
import { DayGridLayout, DayTableSlicer, buildDayTableModel, createDayHeaderFormatter } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel } from '../../resource/common/AbstractResourceDayTableModel'
import { DEFAULT_RESOURCE_ORDER } from '../../resource/resources-crud'
import { buildDayResourceTableModel } from '../../resource/common/DayResourceTableModel'
import { Resource, ResourceHash } from '../../resource/structs/resource'
import { buildResourceDayTableModel } from '../../resource/common/ResourceDayTableModel'
import { ResourceViewProps } from '../../resource/View'
import { buildResourcelessDayTableModel } from '../../resource/common/ResourcelessDayTableModel'
import { computeHasEventsByDate } from '../../resource/common/per-date-filtering'
import { VResourceSplitter } from '../../resource/common/VResourceSplitter'
import { flattenResources } from '../../resource/common/resource-hierarchy'
import { ResourceDayTableJoiner } from '../ResourceDayTableJoiner'
import { buildResourceRowConfigs } from '../resource-header-tier'

export class ResourceDayGridView extends DateComponent<ResourceViewProps> {
  // memo
  private flattenResources = memoize(flattenResources)
  private buildDayTableModel = memoize(buildDayTableModel)
  private buildDayCols = memoize(buildDayGridCols)
  private buildResourceDayTableModel = memoize(buildResourceDayGridTableModel)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)
  private buildResourceRowConfigs = memoize(buildResourceRowConfigs)

  private dayTableModel: DayTableModel
  private resourceDayTableModel: AbstractResourceDayTableModel
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTableSlicer } = {}
  private joiner = new ResourceDayTableJoiner()

  render() {
    let { props, context } = this
    let { options } = context

    let resourceOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let dayTable = this.dayTableModel = this.buildDayTableModel(props.dateProfile, context.dateProfileGenerator, context.dateEnv)
    let dayCols = this.buildDayCols(dayTable)
    let filterResourcesByDate = options.filterResourcesWithEvents === true && dayTable.colCount > 1 && dayTable.rowCount === 1
    let resourceDayTableModel = this.resourceDayTableModel = this.buildResourceDayTableModel(
      dayTable,
      dayCols,
      resources,
      options.datesAboveResources,
      filterResourcesByDate ? props.eventStore : null,
      filterResourcesByDate ? props.resourceStore : null,
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
      dayTable,
    ))
    let joinedSlicedProps = this.joiner.joinProps(slicedProps, resourceDayTableModel)

    let datesRepDistinctDays = dayTable.rowCount === 1
    let dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      datesRepDistinctDays,
      resourceDayTableModel.colCount,
    )

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const headerTiers = this.buildResourceRowConfigs(
            resourceDayTableModel,
            datesRepDistinctDays,
            props.dateProfile,
            todayRange,
            dayHeaderFormat,
            context,
          )

          return (
            <DayGridLayout
              labelId={props.labelId}
              labelStr={props.labelStr}

              dateProfile={props.dateProfile}
              todayRange={todayRange}
              cellRows={resourceDayTableModel.cells}
              forPrint={props.forPrint}
              isHitComboAllowed={this.isHitComboAllowed}
              className={props.className}

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
    let allowAcrossResources = this.dayTableModel.colCount === 1
    return this.resourceDayTableModel.isHitComboAllowed(hit0, hit1, allowAcrossResources)
  }
}

function buildResourceDayGridTableModel(
  dayTable: DayTableModel,
  dayCols: DayCol[],
  resources: Resource[],
  datesAboveResources: boolean,
  eventStore: EventStore | null,
  resourceStore: ResourceHash | null,
  context: CalendarContext,
): AbstractResourceDayTableModel {
  if (!resources.length) {
    return buildResourcelessDayTableModel(dayTable, dayCols, context)
  }

  let hasEventsByDate = eventStore && resourceStore
    ? computeHasEventsByDate(eventStore, resourceStore, dayCols.map((dayCol) => dayCol.range))
    : null

  return datesAboveResources ?
    buildDayResourceTableModel(dayTable, dayCols, resources, context, hasEventsByDate) :
    buildResourceDayTableModel(dayTable, dayCols, resources, context, hasEventsByDate)
}

// Resource daygrid columns repeat across rows, so their date-level descriptors use the first row.
function buildDayGridCols(dayTable: DayTableModel): DayCol[] {
  return dayTable.cellRows[0].map((cell) => ({
    ...cell,
    range: {
      start: cell.date,
      end: addDays(cell.date, 1),
    },
  }))
}
