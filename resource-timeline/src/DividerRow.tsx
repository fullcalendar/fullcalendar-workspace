import { h, Ref, BaseComponent, CssDimValue } from '@fullcalendar/core'


export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
  innerHeight: CssDimValue
}


/*
parallels the SpreadsheetGroupRow
*/
export default class DividerRow extends BaseComponent<DividerRowProps> {

  render(props: DividerRowProps) {
    return (
      <tr ref={props.elRef}>
        <td class={'fc-divider ' + this.context.theme.getClass('tableCellShaded')}>
          <div style={{ height: props.innerHeight }} />
        </td>
      </tr>
    )
  }

}
