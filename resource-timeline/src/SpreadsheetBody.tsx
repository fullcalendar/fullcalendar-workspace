import { BaseComponent, guid, findElements } from '@fullcalendar/core'
import { h, ComponentChildren } from 'preact'
import { renderColGroupNodes } from './SpreadsheetColWidths'

export interface SpreadsheetBodyProps {
  colSpecs: any
  children?: ComponentChildren
}

export default class SpreadsheetBody extends BaseComponent<SpreadsheetBodyProps> {

  colEls: HTMLElement[]


  render(props: SpreadsheetBodyProps) {
    return (
      <div class='fc-rows'>
        <table>
          <colgroup key={guid()} ref={this.handleColGroupEl}>
            {renderColGroupNodes(props.colSpecs)}
          </colgroup>
          <tbody>
            {props.children}
          </tbody>
        </table>
      </div>
    )
  }


  handleColGroupEl = (colGroupEl: HTMLElement | null) => {
    if (colGroupEl) {
      this.colEls = findElements(colGroupEl, 'col')
    }
  }

}
