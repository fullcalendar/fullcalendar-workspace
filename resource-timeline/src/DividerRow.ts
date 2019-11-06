import { Component, createElement, DomLocation } from '@fullcalendar/core'

export default class DividerRow extends Component<DomLocation> {

  heightEl: HTMLElement


  render() {
    let tr = document.createElement('tr')
    let heightEl = document.createElement('div')

    // insert a single cell, with a single empty <div>.
    // there will be no content
    tr.appendChild(
      createElement('td', { className: 'fc-divider' }, heightEl)
    )

    this.heightEl = heightEl

    return tr
  }

}
