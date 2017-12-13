import * as $ from 'jquery'
import { Mixin, DayTableMixin, EventFootprint, parseFieldSpecs, compareByFieldSpecs, htmlEscape } from 'fullcalendar'
import ResourceComponentFootprint from '../models/ResourceComponentFootprint'

export interface ResourceDayTableInterface {
  resourceCnt: any
  flattenedResources: any
  datesAboveResources: boolean
  registerResources(resources)
  processHeadResourceEls(containerEl)
  getColResource(col)
  indicesToCol(resourceIndex, dayIndex)
}

/*
Requirements:
- must be a Grid
- grid must have a view that's a ResourceView
- DayTableMixin must already be mixed in
*/
export default class ResourceDayTableMixin extends Mixin implements ResourceDayTableInterface {

  // initialized after class, because of Mixin shortcomings
  flattenedResources: any
  resourceCnt: number
  datesAboveResources: boolean
  allowCrossResource: boolean

  // for DayTableMixin conformance
  daysPerRow: number
  dayCnt: number
  colCnt: number
  isRTL: boolean
  dayDates: any
  view: any
  hasAllDayBusinessHours: boolean
  dateProfile: any
  businessHourRenderer: any


  static mixInto(destClass) {
    Mixin.mixInto.call(this, destClass);
    [ // methods that will override destination class'
      'updateDayTableCols',
      'computeColCnt',
      'getColDayIndex',
      'renderHeadTrHtml',
      'renderBgCellsHtml',
      'renderBusinessHours',
      'allowCrossResource'
    ].forEach((methodName) => {
      destClass.prototype[methodName] = this.prototype[methodName]
    })
  }


  // Resource Data
  // ----------------------------------------------------------------------------------------------


  // does not do any rendering. rendering is responsibility of host object
  registerResources(resources) {
    this.flattenedResources = this.flattenResources(resources)
    this.resourceCnt = this.flattenedResources.length;
    (this as any).updateDayTable() // will call computeColCnt
  }


  // flattens and sorts
  flattenResources(resources) {
    let sortFunc
    const orderVal = (this as any).opt('resourceOrder')
    if (orderVal) {
      const orderSpecs = parseFieldSpecs(orderVal)
      sortFunc = (a, b) => compareByFieldSpecs(a, b, orderSpecs)
    } else {
      sortFunc = null
    }
    const res = []
    this.accumulateResources(resources, sortFunc, res)
    return res
  }


  // just flattens
  accumulateResources(resources, sortFunc, res) {
    let sortedResources

    if (sortFunc) {
      sortedResources = resources.slice(0) // make copy
      sortedResources.sort(sortFunc) // sorts in place
    } else {
      sortedResources = resources
    }

    for (let resource of sortedResources) {
      res.push(resource)
      this.accumulateResources(resource.children, sortFunc, res)
    }
  }


  // Table Layout
  // ----------------------------------------------------------------------------------------------


  updateDayTableCols() {
    this.datesAboveResources = (this as any).opt('groupByDateAndResource')
    DayTableMixin.prototype.updateDayTableCols.call(this)
  }


  computeColCnt() {
    return this.resourceCnt * this.daysPerRow
  }


  getColDayIndex(col) {
    if (this.isRTL) {
      col = this.colCnt - 1 - col
    }
    if (this.datesAboveResources) {
      return Math.floor(col / (this.resourceCnt || 1))
    } else {
      return col % this.daysPerRow
    }
  }


  getColResource(col) {
    return this.flattenedResources[this.getColResourceIndex(col)]
  }


  getColResourceIndex(col) {
    if (this.isRTL) {
      col = this.colCnt - 1 - col
    }
    if (this.datesAboveResources) {
      return col % (this.resourceCnt || 1)
    } else {
      return Math.floor(col / this.daysPerRow)
    }
  }


  indicesToCol(resourceIndex, dayIndex) {
    let col =
      this.datesAboveResources ?
        (dayIndex * (this.resourceCnt || 1)) + resourceIndex :
        (resourceIndex * this.daysPerRow) + dayIndex
    if (this.isRTL) {
      col = this.colCnt - 1 - col
    }
    return col
  }


  // Header Rendering
  // ----------------------------------------------------------------------------------------------


  renderHeadTrHtml() { // might return two trs
    if (this.daysPerRow > 1) {
      // do two levels
      if (this.datesAboveResources) {
        return this.renderHeadDateAndResourceHtml()
      } else {
        return this.renderHeadResourceAndDateHtml()
      }
    } else {
      // do one level
      return this.renderHeadResourceHtml()
    }
  }


  // renders one row of resources header cell
  renderHeadResourceHtml() {
    const resourceHtmls = this.flattenedResources.map((resource) => (
      this.renderHeadResourceCellHtml(resource)
    ))

    if (!resourceHtmls.length) {
      resourceHtmls.push('<td>&nbsp;</td>')
    }

    return this.wrapTr(resourceHtmls, 'renderHeadIntroHtml')
  }


  // renders resource cells above date cells
  renderHeadResourceAndDateHtml() {
    const resourceHtmls = []
    const dateHtmls = []
    const { daysPerRow } = this

    for (let resource of this.flattenedResources) {
      resourceHtmls.push(
        this.renderHeadResourceCellHtml(resource, null, this.daysPerRow)
      )

      for (let dayIndex = 0; dayIndex < daysPerRow; dayIndex++) {
        const date = this.dayDates[dayIndex].clone()
        dateHtmls.push(
          this.renderHeadResourceDateCellHtml(date, resource)
        )
      }
    }

    if (!resourceHtmls.length) {
      resourceHtmls.push('<td>&nbsp;</td>')
    }

    if (!dateHtmls.length) {
      dateHtmls.push('<td>&nbsp;</td>')
    }

    return this.wrapTr(resourceHtmls, 'renderHeadIntroHtml') +
      this.wrapTr(dateHtmls, 'renderHeadIntroHtml')
  }


  // renders date cells above resource cells
  renderHeadDateAndResourceHtml() {
    const dateHtmls = []
    const resourceHtmls = []
    const { daysPerRow } = this

    for (let dayIndex = 0; dayIndex < daysPerRow; dayIndex++) {
      const date = this.dayDates[dayIndex].clone()

      dateHtmls.push(
        (this as any).renderHeadDateCellHtml(date, this.resourceCnt) // with colspan
      )

      for (let resource of this.flattenedResources) {
        resourceHtmls.push(
          this.renderHeadResourceCellHtml(resource, date)
        )
      }
    }

    if (!dateHtmls.length) {
      dateHtmls.push('<td>&nbsp;</td>')
    }

    if (!resourceHtmls.length) {
      resourceHtmls.push('<td>&nbsp;</td>')
    }

    return this.wrapTr(dateHtmls, 'renderHeadIntroHtml') +
      this.wrapTr(resourceHtmls, 'renderHeadIntroHtml')
  }


  // given a resource and an optional date
  renderHeadResourceCellHtml(resource, date?, colspan = 1) {
    return '<th class="fc-resource-cell"' +
      ' data-resource-id="' + resource.id + '"' +
      (date ?
        ' data-date="' + date.format('YYYY-MM-DD') + '"' :
        '') +
      (colspan > 1 ?
        ' colspan="' + colspan + '"' :
        '') +
    '>' +
      htmlEscape(
        this.view.getResourceText(resource)
      ) +
    '</th>'
  }


  // given a date and a required resource
  renderHeadResourceDateCellHtml(date, resource, colspan = 1) {
    return (this as any).renderHeadDateCellHtml(
      date,
      colspan,
      'data-resource-id="' + resource.id + '"'
    )
  }


  // given a container with already rendered resource cells
  processHeadResourceEls(containerEl) {
    containerEl.find('.fc-resource-cell').each((col, node) => {
      let resource

      if (this.datesAboveResources) {
        // each resource <td> is a distinct column
        resource = this.getColResource(col)
      } else {
        // each resource <td> covers multiple columns of dates
        resource = this.flattenedResources[
          this.isRTL ?
            this.flattenedResources.length - 1 - col :
            col
        ]
      }

      (this as any).publiclyTrigger('resourceRender', {
        context: resource,
        args: [
          resource,
          $(node), // head <td>
          $(), // body <td>'s (we don't compute, but API should stay consistent)
          this.view
        ]
      })
    })
  }


  // Bg Rendering
  // ----------------------------------------------------------------------------------------------
  // TODO: unify with DayTableMixin more, instead of completely redefining


  renderBgCellsHtml(row) {
    const htmls = []
    const { colCnt } = this

    for (let col = 0; col < colCnt; col++) {
      const date = (this as any).getCellDate(row, col)
      const resource = this.getColResource(col)
      htmls.push(this.renderResourceBgCellHtml(date, resource))
    }

    if (!htmls.length) {
      htmls.push('<td>&nbsp;</td>')
    }

    return htmls.join('') // already accounted for RTL
  }


  renderResourceBgCellHtml(date, resource) {
    return (this as any).renderBgCellHtml(date, 'data-resource-id="' + resource.id + '"')
  }


  // Rendering Utils
  // ----------------------------------------------------------------------------------------------

  // only works for when given cells are ordered chronologically
  // mutates cellHtmls
  // TODO: make this a DayTableMixin utility
  wrapTr(cellHtmls, introMethodName) {
    if (this.isRTL) {
      cellHtmls.reverse()
      return '<tr>' +
        cellHtmls.join('') +
        this[introMethodName]() +
      '</tr>'
    } else {
      return '<tr>' +
        this[introMethodName]() +
        cellHtmls.join('') +
      '</tr>'
    }
  }

  // Business Hours
  // ----------------------------------------------------------------------------------------------


  renderBusinessHours(businessHourGenerator) {
    const isAllDay = this.hasAllDayBusinessHours
    const unzonedRange = this.dateProfile.activeUnzonedRange
    const eventFootprints = []

    for (let resource of this.flattenedResources) {

      const eventInstanceGroup = (resource.businessHourGenerator || businessHourGenerator)
        .buildEventInstanceGroup(isAllDay, unzonedRange)

      if (eventInstanceGroup) {
        for (let eventRange of eventInstanceGroup.sliceRenderRanges(unzonedRange)) {
          eventFootprints.push(
            new EventFootprint(
              new ResourceComponentFootprint(
                eventRange.unzonedRange,
                isAllDay,
                resource.id
              ),
              eventRange.eventDef,
              eventRange.eventInstance
            )
          )
        }
      }
    }

    return this.businessHourRenderer.renderEventFootprints(eventFootprints)
  }
}

ResourceDayTableMixin.prototype.resourceCnt = 0
ResourceDayTableMixin.prototype.datesAboveResources = false
ResourceDayTableMixin.prototype.allowCrossResource = false
