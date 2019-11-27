import { BaseComponent } from '@fullcalendar/core'
import { h } from 'preact'


export default class DividerRow extends BaseComponent {

  render() {
    return (
      <tr>
        <td class='fc-divider' />
      </tr>
    )
  }

}
