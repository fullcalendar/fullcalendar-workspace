import {
  VNode, h,
  memoize, Calendar, BaseComponent, DateMarker, DateProfile, createFormatter, DateFormatter, computeFallbackHeaderFormat, ComponentContext, TableDateCell, Fragment,
  RefMap
} from '@fullcalendar/core'
import { buildResourceTextFunc } from '../common/resource-rendering'
import { Resource } from '../structs/resource'
import ResourceApi from '../api/ResourceApi'


export interface ResourceDayHeaderProps {
  dates: DateMarker[]
  dateProfile: DateProfile
  datesRepDistinctDays: boolean
  resources: Resource[] // flattened
  renderIntro?: () => VNode[]
}

export default class ResourceDayHeader extends BaseComponent<ResourceDayHeaderProps> { // TODO: rename to ResourceDayHeaderTrs?

  private buildDateFormatter = memoize(this._buildDateFormatter)
  private processOptions = memoize(this._processOptions)
  private resourceCellRefs = new RefMap<HTMLTableCellElement, [Resource]>(this._handleResourceCellEl.bind(this))
  private datesAboveResources: boolean
  private resourceTextFunc: (resource: Resource) => string
  private dateFormat: DateFormatter


  render(props: ResourceDayHeaderProps, state: {}, context: ComponentContext) {
    let { options, calendar } = context

    this.processOptions(options, calendar)
    this.dateFormat = this.buildDateFormatter(
      options.columnHeaderFormat,
      props.datesRepDistinctDays,
      props.dates.length
    )

    if (props.dates.length === 1) {
      return this.renderResourceRow(props.resources)
    } else {
      if (this.datesAboveResources) {
        return this.renderDayAndResourceRows(props.dates, props.resources)
      } else {
        return this.renderResourceAndDayRows(props.resources, props.dates)
      }
    }
  }


  private _processOptions(options, calendar: Calendar) {
    this.datesAboveResources = options.datesAboveResources
    this.resourceTextFunc = buildResourceTextFunc(options.resourceText, calendar)
  }


  private _buildDateFormatter(columnHeaderFormat, datesRepDistinctDays, dayCnt) {
    return createFormatter(
      columnHeaderFormat ||
      computeFallbackHeaderFormat(datesRepDistinctDays, dayCnt)
    )
  }


  renderResourceRow(resources: Resource[]) {
    let resourceCells = resources.map((resource) => {
      return this.renderResourceCell(resource, 1)
    })

    return this.buildTr(resourceCells, 'resources')
  }


  renderDayAndResourceRows(dates: DateMarker[], resources: Resource[]) {
    let dateCells: VNode[] = []
    let resourceCells: VNode[] = []

    for (let date of dates) {

      dateCells.push(
        this.renderDateCell(date, resources.length)
      )

      for (let resource of resources) {
        resourceCells.push(
          this.renderResourceCell(resource, 1, date)
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


  renderResourceAndDayRows(resources: Resource[], dates: DateMarker[]) {
    let resourceCells: VNode[] = []
    let dateCells: VNode[] = []

    for (let resource of resources) {

      resourceCells.push(
        this.renderResourceCell(resource, dates.length)
      )

      for (let date of dates) {
        dateCells.push(
          this.renderDateCell(date, 1, resource)
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


  // Cell Rendering Utils
  // ----------------------------------------------------------------------------------------------


  // a cell with the resource name. might be associated with a specific day
  renderResourceCell(resource: Resource, colSpan: number, date?: DateMarker) {
    let { dateEnv } = this.context

    let attrs = {
      'class': 'fc-resource-cell',
      'data-resource-id': resource.id
    } as any

    if (date) {
      attrs['data-date'] = dateEnv.formatIso(date, { omitTime: true })
    }

    if (colSpan > 1) {
      attrs.colSpan = colSpan
    }

    attrs.ref = this.resourceCellRefs.createRef(resource.id, resource)

    return (
      <th {...attrs}>{this.resourceTextFunc(resource)}</th>
    )
  }


  // a cell with date text. might have a resource associated with it
  renderDateCell(date: DateMarker, colSpan: number, resource?: Resource) {
    let { dateEnv } = this.context
    let { props } = this
    let distinctDateStr = props.datesRepDistinctDays ? dateEnv.formatIso(date, { omitTime: true }) : ''

    return (
      <TableDateCell
        key={distinctDateStr || date.getDay()}
        distinctDateStr={distinctDateStr}
        dateMarker={date}
        dateProfile={props.dateProfile}
        colCnt={props.dates.length * props.resources.length}
        colHeadFormat={this.dateFormat}
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
      cells = renderIntro().concat(cells)
    }

    return (
      <tr key={key}>{cells}</tr>
    )
  }


  // Post-rendering
  // ----------------------------------------------------------------------------------------------


  _handleResourceCellEl(resourceCellEl: HTMLTableCellElement | null, key: string, resource?: Resource) {
    let { calendar, view } = this.context

    if (resourceCellEl) {
      calendar.publiclyTrigger('resourceRender', [
        {
          resource: new ResourceApi(calendar, resource),
          el: resourceCellEl, // head <td>
          view
        }
      ])
    }
  }

}
