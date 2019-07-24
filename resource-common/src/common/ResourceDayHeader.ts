import { Component, ComponentContext, DateMarker, htmlToElement, removeElement, htmlEscape, DateProfile, renderDateCell, findElements, createFormatter, DateFormatter, computeFallbackHeaderFormat } from '@fullcalendar/core'
import { buildResourceTextFunc } from '../common/resource-rendering'
import { Resource } from '../structs/resource'
import ResourceApi from '../api/ResourceApi'

export interface ResourceDayHeaderProps {
  dates: DateMarker[]
  dateProfile: DateProfile
  datesRepDistinctDays: boolean
  resources: Resource[] // flattened
  renderIntroHtml?: () => string
}

export default class ResourceDayHeader extends Component<ResourceDayHeaderProps> {

  datesAboveResources: boolean
  resourceTextFunc: (resource: Resource) => string
  dateFormat: DateFormatter

  el: HTMLElement
  thead: HTMLElement

  constructor(context: ComponentContext, parentEl: HTMLElement) {
    super(context)

    this.datesAboveResources = this.opt('datesAboveResources')
    this.resourceTextFunc = buildResourceTextFunc(this.opt('resourceText'), this.calendar)

    parentEl.innerHTML = '' // because might be nbsp
    parentEl.appendChild(
      this.el = htmlToElement(
        '<div class="fc-row ' + this.theme.getClass('headerRow') + '">' +
          '<table class="' + this.theme.getClass('tableGrid') + '">' +
            '<thead></thead>' +
          '</table>' +
        '</div>'
      )
    )

    this.thead = this.el.querySelector('thead')
  }

  destroy() {
    removeElement(this.el)
  }

  render(props: ResourceDayHeaderProps) {
    let html

    this.dateFormat = createFormatter(
      this.opt('columnHeaderFormat') ||
      computeFallbackHeaderFormat(props.datesRepDistinctDays, props.dates.length)
    )

    if (props.dates.length === 1) {
      html = this.renderResourceRow(props.resources)
    } else {
      if (this.datesAboveResources) {
        html = this.renderDayAndResourceRows(props.dates, props.resources)
      } else {
        html = this.renderResourceAndDayRows(props.resources, props.dates)
      }
    }

    this.thead.innerHTML = html
    this.processResourceEls(props.resources)
  }

  renderResourceRow(resources: Resource[]): string {
    let cellHtmls = resources.map((resource) => {
      return this.renderResourceCell(resource, 1)
    })

    return this.buildTr(cellHtmls)
  }

  renderDayAndResourceRows(dates: DateMarker[], resources: Resource[]) {
    let dateHtmls = []
    let resourceHtmls = []

    for (let date of dates) {

      dateHtmls.push(
        this.renderDateCell(date, resources.length)
      )

      for (let resource of resources) {
        resourceHtmls.push(
          this.renderResourceCell(resource, 1, date)
        )
      }
    }

    return this.buildTr(dateHtmls) +
      this.buildTr(resourceHtmls)
  }

  renderResourceAndDayRows(resources: Resource[], dates: DateMarker[]) {
    let resourceHtmls = []
    let dateHtmls = []

    for (let resource of resources) {

      resourceHtmls.push(
        this.renderResourceCell(resource, dates.length)
      )

      for (let date of dates) {
        dateHtmls.push(
          this.renderDateCell(date, 1, resource)
        )
      }
    }

    return this.buildTr(resourceHtmls) +
      this.buildTr(dateHtmls)
  }


  // Cell Rendering Utils
  // ----------------------------------------------------------------------------------------------

  // a cell with the resource name. might be associated with a specific day
  renderResourceCell(resource: Resource, colspan: number, date?: DateMarker) {
    const dateEnv = this.dateEnv

    return '<th class="fc-resource-cell"' +
      ' data-resource-id="' + resource.id + '"' +
      (date ?
        ' data-date="' + dateEnv.formatIso(date, { omitTime: true }) + '"' :
        '') +
      (colspan > 1 ?
        ' colspan="' + colspan + '"' :
        '') +
    '>' +
      htmlEscape(
        this.resourceTextFunc(resource)
      ) +
    '</th>'
  }

  // a cell with date text. might have a resource associated with it
  renderDateCell(date: DateMarker, colspan: number, resource?: Resource) {
    let { props } = this

    return renderDateCell(
      date,
      props.dateProfile,
      props.datesRepDistinctDays,
      props.dates.length * props.resources.length,
      this.dateFormat,
      this.context,
      colspan,
      resource ? 'data-resource-id="' + resource.id + '"' : ''
    )
  }

  buildTr(cellHtmls: string[]) {
    if (!cellHtmls.length) {
      cellHtmls = [ '<td>&nbsp;</td>' ]
    }

    if (this.props.renderIntroHtml) {
      cellHtmls = [ this.props.renderIntroHtml() ].concat(cellHtmls)
    }

    if (this.isRtl) {
      cellHtmls.reverse()
    }

    return '<tr>' +
      cellHtmls.join('') +
      '</tr>'
  }


  // Post-rendering
  // ----------------------------------------------------------------------------------------------

  // given a container with already rendered resource cells
  processResourceEls(resources: Resource[]) {
    let { view } = this

    findElements(this.thead, '.fc-resource-cell').forEach((node, col) => { // does DOM-order

      col = col % resources.length
      if (this.isRtl) {
        col = resources.length - 1 - col
      }

      let resource = resources[col]

      view.publiclyTrigger('resourceRender', [
        {
          resource: new ResourceApi(this.calendar, resource),
          el: node, // head <td>
          view
        }
      ])
    })
  }

}
