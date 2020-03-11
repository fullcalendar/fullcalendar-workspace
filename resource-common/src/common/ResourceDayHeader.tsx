import {
  VNode, h,
  memoize, BaseComponent, DateMarker, DateProfile, createFormatter, DateFormatter, computeFallbackHeaderFormat, ComponentContext, TableDateCell, Fragment, DateRange, NowTimer
} from '@fullcalendar/core'
import { buildResourceTextFunc } from '../common/resource-rendering'
import { Resource } from '../structs/resource'
import ResourceApi from '../api/ResourceApi'


export interface ResourceDayHeaderProps {
  dates: DateMarker[]
  dateProfile: DateProfile
  datesRepDistinctDays: boolean
  resources: Resource[] // flattened
  renderIntro?: () => VNode
}

export default class ResourceDayHeader extends BaseComponent<ResourceDayHeaderProps> { // TODO: rename to ResourceDayHeaderTrs?

  private buildDateFormat = memoize(buildDateFormat)
  private buildResourceTextFunc = memoize(buildResourceTextFunc)


  render(props: ResourceDayHeaderProps, state: {}, context: ComponentContext) {
    let { options, calendar } = context

    let dateFormat = this.buildDateFormat(
      options.columnHeaderFormat,
      props.datesRepDistinctDays,
      props.dates.length
    )

    let resourceTextFunc = this.buildResourceTextFunc(
      options.resourceText,
      calendar
    )

    return (
      <NowTimer unit='day' content={(nowDate: DateMarker, todayRange: DateRange) => {
        if (props.dates.length === 1) {
          return this.renderResourceRow(props.resources, resourceTextFunc)
        } else {
          if (options.datesAboveResources) {
            return this.renderDayAndResourceRows(props.dates, dateFormat, todayRange, props.resources, resourceTextFunc)
          } else {
            return this.renderResourceAndDayRows(props.resources, resourceTextFunc, props.dates, dateFormat, todayRange)
          }
        }
      }} />
    )
  }


  renderResourceRow(resources: Resource[], resourceTextFunc) {
    let resourceCells = resources.map((resource) => {
      return (
        <ResourceCell
          resource={resource}
          resourceTextFunc={resourceTextFunc}
          colSpan={1}
        />
      )
    })

    return this.buildTr(resourceCells, 'resources')
  }


  renderDayAndResourceRows(dates: DateMarker[], dateFormat: DateFormatter, todayRange: DateRange, resources: Resource[], resourceTextFunc) {
    let dateCells: VNode[] = []
    let resourceCells: VNode[] = []

    for (let date of dates) {

      dateCells.push(
        this.renderDateCell(date, dateFormat, todayRange, resources.length)
      )

      for (let resource of resources) {
        resourceCells.push(
          <ResourceCell
            resource={resource}
            resourceTextFunc={resourceTextFunc}
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


  renderResourceAndDayRows(resources: Resource[], resourceTextFunc, dates: DateMarker[], dateFormat: DateFormatter, todayRange: DateRange) {
    let resourceCells: VNode[] = []
    let dateCells: VNode[] = []

    for (let resource of resources) {

      resourceCells.push(
        <ResourceCell
          resource={resource}
          resourceTextFunc={resourceTextFunc}
          colSpan={dates.length}
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
  renderDateCell(date: DateMarker, dateFormat: DateFormatter, todayRange: DateRange, colSpan: number, resource?: Resource) {
    let { dateEnv } = this.context
    let { props } = this
    let distinctDateStr = props.datesRepDistinctDays ? dateEnv.formatIso(date, { omitTime: true }) : ''

    return (
      <TableDateCell
        key={distinctDateStr || date.getDay()}
        distinctDateStr={distinctDateStr}
        date={date}
        todayRange={todayRange}
        dateProfile={props.dateProfile}
        colCnt={props.dates.length * props.resources.length}
        colHeadFormat={dateFormat}
        colSpan={colSpan}
        otherAttrs={resource ? { 'data-resource-id' : resource.id } : {}}
      />
    )
  }


  buildTr(cells: VNode[], key: string) {
    let { renderIntro } = this.props

    if (!cells.length) {
      cells = [ <td>&nbsp;</td> ]
    }

    if (renderIntro) {
      cells.push(renderIntro())
    }

    return (
      <tr key={key}>{cells}</tr>
    )
  }

}


function buildDateFormat(columnHeaderFormat, datesRepDistinctDays, dayCnt) {
  return createFormatter(
    columnHeaderFormat ||
    computeFallbackHeaderFormat(datesRepDistinctDays, dayCnt)
  )
}


interface ResourceCellProps {
  resource: Resource
  resourceTextFunc: (resource: Resource) => string
  colSpan: number
  date?: DateMarker
}

class ResourceCell extends BaseComponent<ResourceCellProps> {


  render(props: ResourceCellProps) {
    let { dateEnv } = this.context

    let attrs = {
      'class': 'fc-resource-cell',
      'data-resource-id': props.resource.id
    } as any

    if (props.date) {
      attrs['data-date'] = dateEnv.formatIso(props.date, { omitTime: true })
    }

    if (props.colSpan > 1) {
      attrs.colSpan = props.colSpan
    }

    return (
      <th {...attrs}>{props.resourceTextFunc(props.resource)}</th>
    )
  }


  handleCellEl = (cellEl: HTMLTableCellElement | null) => {
    let { calendar, view } = this.context

    if (cellEl) {
      calendar.publiclyTrigger('resourceRender', [
        {
          resource: new ResourceApi(calendar, this.props.resource),
          el: cellEl, // head <td>
          view
        }
      ])
    }
  }

}
