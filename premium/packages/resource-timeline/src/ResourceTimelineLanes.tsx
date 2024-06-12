import { CssDimValue } from '@fullcalendar/core'
import { BaseComponent } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { ResourceTimelineLanesBody, ResourceTimelineLanesContentProps } from './ResourceTimelineLanesBody.js'

export interface ResourceTimelineLanesProps extends ResourceTimelineLanesContentProps {
  minHeight: CssDimValue
  clientWidth: number | null
  tableMinWidth: CssDimValue
}

export class ResourceTimelineLanes extends BaseComponent<ResourceTimelineLanesProps> {
  render() {
    let { props, context } = this

    return (
      <table
        aria-hidden
        className={context.theme.getClass('table')}
        style={{
          minWidth: props.tableMinWidth,
          width: props.clientWidth,
          height: props.minHeight,
        }}
      >
        <ResourceTimelineLanesBody
          groupRowDisplays={props.groupRowDisplays}
          resourceRowDisplays={props.resourceRowDisplays}
          dateProfile={props.dateProfile}
          tDateProfile={props.tDateProfile}
          nowDate={props.nowDate}
          todayRange={props.todayRange}
          splitProps={props.splitProps}
          fallbackBusinessHours={props.fallbackBusinessHours}
          slatCoords={props.slatCoords}
          verticalPositions={props.verticalPositions}
        />
      </table>
    )
  }
}
