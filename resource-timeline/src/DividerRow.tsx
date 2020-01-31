import { h, Ref, BaseComponent } from '@fullcalendar/core'


export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
}


export default class DividerRow extends BaseComponent<DividerRowProps> {

  render(props: DividerRowProps) {
    return (
      <tr ref={props.elRef}>
        <td class={'fc-divider ' + this.context.theme.getClass('tableCellShaded')}>
          <div />
        </td>
      </tr>
    )
  }

}
