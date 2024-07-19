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
import { DateHeaderCell, DayGridLayout, DayOfWeekHeaderCell, DayTableSlicer, buildDayTableModel } from '@fullcalendar/daygrid/internal'
import {
  DEFAULT_RESOURCE_ORDER,
  DayResourceTableModel,
  Resource,
  ResourceDayTableModel,
  ResourceViewProps,
  VResourceSplitter,
  flattenResources,
} from '@fullcalendar/resource/internal'
import { ResourceDayTableJoiner } from '../ResourceDayTableJoiner.js'
import { buildHeaderTiers } from './header-cell-utils.js'
import { ResourceHeaderCell } from './ResourceHeaderCell.js'

export class ResourceDayGridView extends DateComponent<ResourceViewProps> {
  private flattenResources = memoize(flattenResources)
  private buildResourceDayTableModel = memoize(buildResourceDayTableModel)

  private resourceDayTableModel: ResourceDayTableModel
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

    let datesRepDistinctDays = resourceDayTableModel.dayTableModel.rowCnt === 1

    let headerTiers = buildHeaderTiers(
      resources,
      resourceDayTableModel.dayTableModel.headerDates,
      options.datesAboveResources,
      datesRepDistinctDays,
      context,
    )

    let joinedSlicedProps = this.joiner.joinProps(slicedProps, resourceDayTableModel)

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <DayGridLayout
            dateProfile={props.dateProfile}
            todayRange={todayRange}
            cellRows={resourceDayTableModel.cells}
            forPrint={props.forPrint}
            isHitComboAllowed={this.isHitComboAllowed}

            // header content
            // TODO: DRY with DayGridView/ResourceTimeGridView
            headerTiers={headerTiers}
            renderHeaderContent={(model, tierNum) => {
              if (model.type === 'date') {
                return (
                  <DateHeaderCell
                    key={model.date.toISOString()}
                    {...model}
                    navLink={resourceDayTableModel.dayTableModel.colCnt > 1 /* correct? */}
                    dateProfile={props.dateProfile}
                    todayRange={todayRange}
                    dayHeaderFormat={undefined /* TODO: figure `dayHeaderFormat` out */}
                    colSpan={model.colSpan}
                    colWidth={undefined}
                  />
                )
              } else if (model.type === 'dayOfWeek') {
                <DayOfWeekHeaderCell
                  key={model.dow}
                  {...model}
                  dayHeaderFormat={undefined /* TODO: figure `dayHeaderFormat` out */}
                  colSpan={model.colSpan}
                  colWidth={undefined}
                />
              } else { // 'resource'
                return (
                  <ResourceHeaderCell
                    cell={model}
                    colSpan={model.colSpan}
                    colWidth={undefined}
                    isSticky={tierNum < headerTiers.length - 1}
                  />
                )
              }
            }}
            getHeaderModelKey={(cell) => (
              // TODO: make DRY
              cell.type === 'resource'
                ? cell.resource.id
                : cell.type === 'date'
                  ? cell.date.toISOString() // correct?
                  : cell.dow
            )}

            // body content
            fgEventSegs={joinedSlicedProps.fgEventSegs}
            bgEventSegs={joinedSlicedProps.bgEventSegs}
            businessHourSegs={joinedSlicedProps.businessHourSegs}
            dateSelectionSegs={joinedSlicedProps.dateSelectionSegs}
            eventDrag={joinedSlicedProps.eventDrag}
            eventResize={joinedSlicedProps.eventResize}
            eventSelection={joinedSlicedProps.eventSelection}
          />
        )}
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
) {
  let dayTable = buildDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources, context) :
    new ResourceDayTableModel(dayTable, resources, context)
}
