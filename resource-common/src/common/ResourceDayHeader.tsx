import {
  VNode, h,
  memoize, Calendar, BaseComponent, DateMarker, DateProfile, findElements, createFormatter, DateFormatter, computeFallbackHeaderFormat, ComponentContext, TableDateCell, guid
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

export default class ResourceDayHeader extends BaseComponent<ResourceDayHeaderProps> {

  private buildDateFormatter = memoize(this._buildDateFormatter)
  private processOptions = memoize(this._processOptions)

  private datesAboveResources: boolean
  private resourceTextFunc: (resource: Resource) => string
  private dateFormat: DateFormatter

  rootEl: HTMLElement


  render(props: ResourceDayHeaderProps, state: {}, context: ComponentContext) {
    let { options, calendar, theme } = context

    this.processOptions(options, calendar)
    this.dateFormat = this.buildDateFormatter(
      options.columnHeaderFormat,
      props.datesRepDistinctDays,
      props.dates.length
    )

    let thead: VNode

    if (props.dates.length === 1) {
      thead = this.renderResourceRow(props.resources)
    } else {
      if (this.datesAboveResources) {
        thead = this.renderDayAndResourceRows(props.dates, props.resources)
      } else {
        thead = this.renderResourceAndDayRows(props.resources, props.dates)
      }
    }

    return ( // guid rerenders whole DOM every time
      <div class={'fc-row ' + theme.getClass('headerRow')} key={guid()} ref={this.handleRootEl}>
        <table class={theme.getClass('tableGrid')}>
          {thead}
        </table>
      </div>
    )
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

    return (
      <thead>
        {this.buildTr(resourceCells)}
      </thead>
    )
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
      <thead>
        {this.buildTr(dateCells)}
        {this.buildTr(resourceCells)}
      </thead>
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
      <thead>
        {this.buildTr(resourceCells)}
        {this.buildTr(dateCells)}
      </thead>
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

    return (
      <th {...attrs}>{this.resourceTextFunc(resource)}</th>
    )
  }


  // a cell with date text. might have a resource associated with it
  renderDateCell(date: DateMarker, colSpan: number, resource?: Resource) {
    let { props } = this

    return (
      <TableDateCell
        dateMarker={date}
        dateProfile={props.dateProfile}
        datesRepDistinctDays={props.datesRepDistinctDays}
        colCnt={props.dates.length * props.resources.length}
        colHeadFormat={this.dateFormat}
        colSpan={colSpan}
        otherAttrs={resource ? { 'data-resource-id' : resource.id } : {}}
      />
    )
  }


  buildTr(cells: VNode[]) {
    let { isRtl } = this.context
    let { renderIntro } = this.props

    if (!cells.length) {
      cells = [ <td>&nbsp;</td> ]
    }

    if (renderIntro) {
      cells = renderIntro().concat(cells)
    }

    if (isRtl) {
      cells.reverse()
    }

    return (
      <tr>{cells}</tr>
    )
  }


  // Post-rendering
  // ----------------------------------------------------------------------------------------------


  // given a container with already rendered resource cells
  handleRootEl = (rootEl: HTMLElement | null) => {
    let { calendar, isRtl, view } = this.context
    let { resources } = this.props

    this.rootEl = rootEl

    if (rootEl) {
      findElements(rootEl, '.fc-resource-cell').forEach((node, col) => { // does DOM-order

        col = col % resources.length
        if (isRtl) {
          col = resources.length - 1 - col
        }

        let resource = resources[col]

        calendar.publiclyTrigger('resourceRender', [
          {
            resource: new ResourceApi(calendar, resource),
            el: node, // head <td>
            view
          }
        ])
      })
    }
  }

}
