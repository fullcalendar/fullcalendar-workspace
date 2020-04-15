import {
  VNode, h, TableDowCell,
  memoize, BaseComponent, DateMarker, DateProfile, createFormatter, DateFormatter, computeFallbackHeaderFormat, ComponentContext, TableDateCell, Fragment, DateRange, NowTimer, Ref, ComponentChildren
} from '@fullcalendar/core'
import { Resource } from '../structs/resource'
import { ResourceLabelRoot } from './ResourceLabelRoot'
import { ResourceApi } from '../api/ResourceApi'


export interface ResourceDayHeaderProps {
  dates: DateMarker[]
  dateProfile: DateProfile
  datesRepDistinctDays: boolean
  resources: Resource[] // flattened
  renderIntro?: () => VNode
}

export class ResourceDayHeader extends BaseComponent<ResourceDayHeaderProps> { // TODO: rename to ResourceDayHeaderTrs?

  private buildDateFormat = memoize(buildDateFormat)


  render(props: ResourceDayHeaderProps, state: {}, context: ComponentContext) {
    let { options } = context

    let dateFormat = this.buildDateFormat(
      options.dayHeaderFormat,
      props.datesRepDistinctDays,
      props.dates.length
    )

    return (
      <NowTimer unit='day' content={(nowDate: DateMarker, todayRange: DateRange) => {
        if (props.dates.length === 1) {
          return this.renderResourceRow(props.resources, props.dates[0])
        } else {
          if (options.datesAboveResources) {
            return this.renderDayAndResourceRows(props.dates, dateFormat, todayRange, props.resources)
          } else {
            return this.renderResourceAndDayRows(props.resources, props.dates, dateFormat, todayRange)
          }
        }
      }} />
    )
  }


  renderResourceRow(resources: Resource[], date: DateMarker) {
    let resourceCells = resources.map((resource) => {
      return (
        <ResourceCell
          resource={resource}
          colSpan={1}
          date={date}
        />
      )
    })

    return this.buildTr(resourceCells, 'resources')
  }


  renderDayAndResourceRows(dates: DateMarker[], dateFormat: DateFormatter, todayRange: DateRange, resources: Resource[]) {
    let dateCells: VNode[] = []
    let resourceCells: VNode[] = []

    for (let date of dates) {

      dateCells.push(
        this.renderDateCell(date, dateFormat, todayRange, resources.length, null, true)
      )

      for (let resource of resources) {
        resourceCells.push(
          <ResourceCell
            key={resource.id + ':' + date.toISOString()}
            resource={resource}
            colSpan={1}
            date={date}
          />
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
          isSticky={true}
        />
      )

      for (let date of dates) {
        dateCells.push(
          this.renderDateCell(date, dateFormat, todayRange, 1, resource)
        )
      }
    }

    return (
      <Fragment>
        {this.buildTr(resourceCells, 'day')}
        {this.buildTr(dateCells, 'resources')}
      </Fragment>
    )
  }


  // a cell with date text. might have a resource associated with it
  renderDateCell(date: DateMarker, dateFormat: DateFormatter, todayRange: DateRange, colSpan: number, resource?: Resource, isSticky?: boolean) {
    let { props } = this
    let keyPostfix = resource ? `:${resource.id}` : ''
    let extraHookProps = resource ? { resource: new ResourceApi(this.context.calendar, resource) } : {}
    let extraDataAttrs = resource ? { 'data-resource-id' : resource.id } : {}

    return props.datesRepDistinctDays ?
      <TableDateCell
        key={date.toISOString() + keyPostfix}
        date={date}
        todayRange={todayRange}
        dateProfile={props.dateProfile}
        colCnt={props.dates.length * props.resources.length}
        dayHeaderFormat={dateFormat}
        colSpan={colSpan}
        isSticky={isSticky}
        extraHookProps={extraHookProps}
        extraDataAttrs={extraDataAttrs}
      /> :
      <TableDowCell // we can't leverage the pure-componentness becausae the extra* props are new every time :(
        key={date.getUTCDay() + keyPostfix}
        dow={date.getUTCDay()}
        dayHeaderFormat={dateFormat}
        colSpan={colSpan}
        isSticky={isSticky}
        extraHookProps={extraHookProps}
        extraDataAttrs={extraDataAttrs}
      />
  }


  buildTr(cells: VNode[], key: string) {
    let { renderIntro } = this.props

    if (!cells.length) {
      cells = [ <td>&nbsp;</td> ]
    }

    return (
      <tr key={key}>
        {renderIntro && renderIntro()}
        {cells}
      </tr>
    )
  }

}


function buildDateFormat(dayHeaderFormat, datesRepDistinctDays, dayCnt) {
  return createFormatter(
    dayHeaderFormat ||
    computeFallbackHeaderFormat(datesRepDistinctDays, dayCnt)
  )
}


interface ResourceCellProps {
  resource: Resource
  colSpan: number
  date?: DateMarker
  isSticky?: boolean
}

class ResourceCell extends BaseComponent<ResourceCellProps> {

  render(props: ResourceCellProps) {
    return (
      <ResourceLabelRoot resource={props.resource} date={props.date}>
        {(elRef: Ref<HTMLTableCellElement>, customClassNames: string[], dataAttrs, innerElRef, innerContent: ComponentChildren) => (
          <th
            ref={elRef}
            className={[ 'fc-col-header-cell', 'fc-resource' ].concat(customClassNames).join(' ')}
            colSpan={props.colSpan}
            {...dataAttrs}
          >
            <span
              class={[
                'fc-col-header-cell-cushion',
                props.isSticky ? 'fc-sticky' : ''
              ].join(' ')}
              ref={innerElRef}
            >
              {innerContent}
            </span>
          </th>
        )}
      </ResourceLabelRoot>
    )
  }

}
