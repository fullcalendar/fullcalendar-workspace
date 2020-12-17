import {
  VNode, createElement, TableDowCell, memoize, BaseComponent,
  DateMarker, DateFormatter, computeFallbackHeaderFormat, TableDateCell, Fragment,
  DateRange, NowTimer, DateProfile,
} from '@fullcalendar/common'
import { Resource } from '../structs/resource'
import { ResourceApi } from '../api/ResourceApi'
import { ResourceCell } from './ResourceCell'

export interface ResourceDayHeaderProps {
  dates: DateMarker[]
  dateProfile: DateProfile
  datesRepDistinctDays: boolean
  resources: Resource[] // flattened
  renderIntro?: (rowKey: string) => VNode
}

export class ResourceDayHeader extends BaseComponent<ResourceDayHeaderProps> { // TODO: rename to ResourceDayHeaderTrs?
  private buildDateFormat = memoize(buildDateFormat)

  render() {
    let { props, context } = this
    let dateFormat = this.buildDateFormat(
      context.options.dayHeaderFormat,
      props.datesRepDistinctDays,
      props.dates.length,
    )

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => {
          if (props.dates.length === 1) {
            return this.renderResourceRow(props.resources, props.dates[0])
          }
          if (context.options.datesAboveResources) {
            return this.renderDayAndResourceRows(props.dates, dateFormat, todayRange, props.resources)
          }
          return this.renderResourceAndDayRows(props.resources, props.dates, dateFormat, todayRange)
        }}
      </NowTimer>
    )
  }

  renderResourceRow(resources: Resource[], date: DateMarker) {
    let resourceCells = resources.map((resource) => (
      <ResourceCell
        key={resource.id}
        resource={resource}
        colSpan={1}
        date={date}
      />
    ))
    return this.buildTr(resourceCells, 'resources')
  }

  renderDayAndResourceRows(dates: DateMarker[], dateFormat: DateFormatter, todayRange: DateRange, resources: Resource[]) {
    let dateCells: VNode[] = []
    let resourceCells: VNode[] = []

    for (let date of dates) {
      dateCells.push(
        this.renderDateCell(date, dateFormat, todayRange, resources.length, null, true),
      )

      for (let resource of resources) {
        resourceCells.push(
          <ResourceCell
            key={resource.id + ':' + date.toISOString()}
            resource={resource}
            colSpan={1}
            date={date}
          />,
        )
      }
    }

    return (
      <Fragment>
        {this.buildTr(dateCells, 'day')}
        {this.buildTr(resourceCells, 'resources')}
      </Fragment>
    )
  }

  renderResourceAndDayRows(resources: Resource[], dates: DateMarker[], dateFormat: DateFormatter, todayRange: DateRange) {
    let resourceCells: VNode[] = []
    let dateCells: VNode[] = []

    for (let resource of resources) {
      resourceCells.push(
        <ResourceCell
          key={resource.id}
          resource={resource}
          colSpan={dates.length}
          isSticky
        />,
      )

      for (let date of dates) {
        dateCells.push(
          this.renderDateCell(date, dateFormat, todayRange, 1, resource),
        )
      }
    }

    return (
      <Fragment>
        {this.buildTr(resourceCells, 'resources')}
        {this.buildTr(dateCells, 'day')}
      </Fragment>
    )
  }

  // a cell with date text. might have a resource associated with it
  renderDateCell(
    date: DateMarker,
    dateFormat: DateFormatter,
    todayRange: DateRange,
    colSpan: number,
    resource?: Resource,
    isSticky?: boolean,
  ) {
    let { props } = this
    let keyPostfix = resource ? `:${resource.id}` : ''
    let extraHookProps = resource ? { resource: new ResourceApi(this.context, resource) } : {}
    let extraDataAttrs = resource ? { 'data-resource-id': resource.id } : {}

    return props.datesRepDistinctDays ? (
      <TableDateCell
        key={date.toISOString() + keyPostfix}
        date={date}
        dateProfile={props.dateProfile}
        todayRange={todayRange}
        colCnt={props.dates.length * props.resources.length}
        dayHeaderFormat={dateFormat}
        colSpan={colSpan}
        isSticky={isSticky}
        extraHookProps={extraHookProps}
        extraDataAttrs={extraDataAttrs}
      />
    ) : (
      <TableDowCell // we can't leverage the pure-componentness becausae the extra* props are new every time :(
        key={date.getUTCDay() + keyPostfix}
        dow={date.getUTCDay()}
        dayHeaderFormat={dateFormat}
        colSpan={colSpan}
        isSticky={isSticky}
        extraHookProps={extraHookProps}
        extraDataAttrs={extraDataAttrs}
      />
    )
  }

  buildTr(cells: VNode[], key: string) {
    let { renderIntro } = this.props

    if (!cells.length) {
      cells = [<td key={0}>&nbsp;</td>]
    }

    return (
      <tr key={key}>
        {renderIntro && renderIntro(key)}
        {cells}
      </tr>
    )
  }
}

function buildDateFormat(dayHeaderFormat: DateFormatter, datesRepDistinctDays, dayCnt) {
  return dayHeaderFormat || computeFallbackHeaderFormat(datesRepDistinctDays, dayCnt)
}
