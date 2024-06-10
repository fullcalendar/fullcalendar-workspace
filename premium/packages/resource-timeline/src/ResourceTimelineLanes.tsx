import { CssDimValue } from '@fullcalendar/core'
import { BaseComponent, RefMap } from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { ResourceTimelineLanesBody, ResourceTimelineLanesContentProps } from './ResourceTimelineLanesBody.js'
import { SizeSyncer } from './SizeSyncer.js'

export interface ResourceTimelineLanesProps extends ResourceTimelineLanesContentProps {
  minHeight: CssDimValue
  clientWidth: number | null
  tableMinWidth: CssDimValue
  rowSyncer: SizeSyncer
}

export class ResourceTimelineLanes extends BaseComponent<ResourceTimelineLanesProps> {
  private rootElRef = createRef<HTMLTableElement>()
  private rowElRefs = new RefMap<HTMLElement>()

  render() {
    let { props, context } = this

    return (
      <table
        ref={this.rootElRef}
        aria-hidden
        className={context.theme.getClass('table')}
        style={{
          minWidth: props.tableMinWidth,
          width: props.clientWidth,
          height: props.minHeight,
        }}
      >
        <ResourceTimelineLanesBody
          rowElRefs={this.rowElRefs}
          rowNodes={props.rowNodes}
          dateProfile={props.dateProfile}
          tDateProfile={props.tDateProfile}
          nowDate={props.nowDate}
          todayRange={props.todayRange}
          splitProps={props.splitProps}
          fallbackBusinessHours={props.fallbackBusinessHours}
          slatCoords={props.slatCoords}
          rowSyncer={props.rowSyncer}
        />
      </table>
    )
  }
}
