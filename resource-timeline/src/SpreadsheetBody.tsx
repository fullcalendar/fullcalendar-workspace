import { BaseComponent, guid, findElements } from '@fullcalendar/core'
import { h, ComponentChildren, VNode } from 'preact'

export interface SpreadsheetBodyProps {
  colGroupNodes: VNode[]
  children?: ComponentChildren
}

export default class SpreadsheetBody extends BaseComponent<SpreadsheetBodyProps> {

  colEls: HTMLElement[]


  render(props: SpreadsheetBodyProps) {
    return (
      <div class='fc-rows'>
        <table>
          <colgroup key={guid()} ref={this.handleColGroupEl}>
            {props.colGroupNodes}
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
