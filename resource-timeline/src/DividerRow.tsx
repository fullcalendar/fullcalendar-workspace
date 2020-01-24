import { h, BaseComponent } from '@fullcalendar/core'


export default class DividerRow extends BaseComponent {

  render() {
    return (
      <tr>
        <td class={'fc-divider ' + this.context.theme.getClass('tableCellShaded')}>
          <div />
        </td>
      </tr>
    )
  }

}
