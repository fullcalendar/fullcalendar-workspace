import {
  DateComponent,
  DayCol,
  DateMarker,
  DateRange,
  DayTableModel,
  Hit,
  NowTimer,
  addDays,
  mapHash,
  memoize,
} from '@fullcalendar/preact/protected-api'
import { DayGridLayout, DayTableSlicer, buildDayTableModel, createDayHeaderFormatter } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel } from '../../resource/common/AbstractResourceDayTableModel'
import { DEFAULT_RESOURCE_ORDER } from '../../resource/resources-crud'
import { ResourceViewProps } from '../../resource/View'
import { computeHasEventsByDate, filterResourceStore } from '../../resource/common/resource-filtering'
import { buildResourceTableModel } from '../../resource/common/resource-table-model'
import { VResourceSplitter } from '../../resource/common/VResourceSplitter'
import { flattenResources } from '../../resource/common/resource-hierarchy'
import { ResourceDayTableJoiner } from '../ResourceDayTableJoiner'
import { buildResourceRowConfigs } from '../resource-header-tier'

export class ResourceDayGridView extends DateComponent<ResourceViewProps> {
  // memo
  private filterResourceStore = memoize(filterResourceStore)
  private flattenResources = memoize(flattenResources)
  private buildDayTableModel = memoize(buildDayTableModel)
  private buildDayCols = memoize(buildDayGridCols)
  private computeHasEventsByDate = memoize(computeHasEventsByDate)
  private buildResourceTableModel = memoize(buildResourceTableModel)
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

    let resourceStore = this.filterResourceStore(
      props.resourceStore,
      options.filterResourcesWithEvents,
      props.rawEventStore,
      props.dateProfile.activeRange,
    )
    let resourceOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
    let resources = this.flattenResources(resourceStore, resourceOrderSpecs)
    let dayTable = this.dayTableModel = this.buildDayTableModel(props.dateProfile, context.dateProfileGenerator, context.dateEnv)
    let dayCols = this.buildDayCols(dayTable)

    // a multi-row column represents one weekday across many dates, so it has no single date
    // to filter by — those views keep view-wide filtering only. nextDayThreshold matches how
    // the renderer decides which day a timed event's tail belongs to
    let hasEventsByDate = options.filterResourcesWithEvents && dayTable.colCount > 1 && dayTable.rowCount === 1
      ? this.computeHasEventsByDate(props.rawEventStore, resourceStore, dayCols, options.nextDayThreshold)
      : null

    let resourceDayTableModel = this.resourceDayTableModel = this.buildResourceTableModel(
      dayTable,
      dayCols,
      resources,
      options.datesAboveResources,
      hasEventsByDate,
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
