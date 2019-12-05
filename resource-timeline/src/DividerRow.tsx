import { h, BaseComponent } from '@fullcalendar/core'


export default class DividerRow extends BaseComponent {

  render() {
    return (
      <tr>
        <td class='fc-divider'>
          <div />
        </td>
      </tr>
    )
  }

}
