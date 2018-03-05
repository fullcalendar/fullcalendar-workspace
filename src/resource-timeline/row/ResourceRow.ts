import * as $ from 'jquery'
import { htmlEscape } from 'fullcalendar'
import EventRow from './EventRow'

/*
A row that renders information about a particular resource, as well as it events (handled by superclass)
*/
export default class ResourceRow extends EventRow {

  resource: any
  eventsPayload: any
  businessHourGenerator: any


  constructor(view, resource) {
    super(view)
    this.resource = resource
    this.eventRenderer.designatedResource = this.resource
  }


  renderSkeleton() {
    super.renderSkeleton()
    this.updateExpandingEnabled()

    if (this.eventsPayload) {
      EventRow.prototype.executeEventRender.call(this, this.eventsPayload)
    }

    if (
      this.businessHourGenerator &&
      this.view.dateProfile // hack
    ) {
      EventRow.prototype.renderBusinessHours.call(this, this.businessHourGenerator)
    }

    this.view.publiclyTrigger('resourceRender', {
      context: this.resource,
      args: [
        this.resource,
        this.getTr('spreadsheet').find('> td'), // TODO: optimize
        this.getTr('event').find('> td'), // TODO: optimize
        this.view
      ]
    })
  }


  removeElement() {
    super.removeElement()

    if (this.eventsPayload) {
      EventRow.prototype.executeEventUnrender.call(this, this.eventsPayload)
    }

    if (this.businessHourGenerator) {
      EventRow.prototype.unrenderBusinessHours.call(this, this.businessHourGenerator)
    }
  }


  renderEventSkeleton(tr) {
    super.renderEventSkeleton(tr)
    tr.attr('data-resource-id', this.resource.id)
  }


  executeEventRender(eventsPayload) { // save the events!
    this.eventsPayload = eventsPayload
    if (this.get('isInDom')) {
      super.executeEventRender(this.eventsPayload)
    }
  }


  executeEventUnrender() {
    super.executeEventUnrender()
    this.eventsPayload = null
  }


  renderBusinessHours(businessHourGenerator) { // save the business hours!
    this.businessHourGenerator = businessHourGenerator

    if (this.get('isInDom')) {
      super.renderBusinessHours(this.businessHourGenerator)
    }
  }


  unrenderBusinessHours() {
    super.unrenderBusinessHours()
    this.businessHourGenerator = null
  }


  /*
  Populates the TR with cells containing data about the resource
  */
  renderSpreadsheetSkeleton(tr) {
    const { theme } = this.view.calendar
    const { resource } = this

    for (let colSpec of this.view.colSpecs) {

      if (colSpec.group) { // not responsible for group-based rows. VRowGroup is
        continue
      }

      const input = // the source text, and the main argument for the filter functions
        colSpec.field ?
          resource[colSpec.field] || null :
          resource

      const text =
        typeof colSpec.text === 'function' ?
          colSpec.text(resource, input) : // the colspec provided a text filter function
          input

      let contentEl = $(
        '<div class="fc-cell-content">' +
          (colSpec.isMain ? this.renderGutterHtml() : '') +
          '<span class="fc-cell-text">' +
            (text ? htmlEscape(text) : '&nbsp;') +
          '</span>' +
        '</div>'
      )

      if (typeof colSpec.render === 'function') { // a filter function for the element
        contentEl = colSpec.render(resource, contentEl, input) || contentEl
      }

      const td = $('<td class="' + theme.getClass('widgetContent') + '"/>')
        .append(contentEl)

      // the first cell of the row needs to have an inner div for setTrInnerHeight
      if (colSpec.isMain) {
        td.wrapInner('<div/>')
      }

      tr.append(td)
    }

    tr.attr('data-resource-id', resource.id)
  }


  /*
  Renders the HTML responsible for the subrow expander area,
  as well as the space before it (used to align expanders of similar depths)
  */
  renderGutterHtml() {
    let html = ''
    const { depth } = this

    for (let i = 0; i < depth; i++) {
      html += '<span class="fc-icon"/>'
    }

    html +=
      '<span class="fc-expander-space">' +
        '<span class="fc-icon"></span>' +
      '</span>'

    return html
  }

}
