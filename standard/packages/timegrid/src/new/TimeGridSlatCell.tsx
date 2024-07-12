import { SlotLaneContentArg } from '@fullcalendar/core'
import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { Ref, createElement } from '@fullcalendar/core/preact'
import { TimeSlatMeta } from '../time-slat-meta.js'

export interface TimeGridSlatCellProps {
  slatMeta: TimeSlatMeta
  elRef?: Ref<HTMLElement>
}

export class TimeGridSlatCell extends BaseComponent<TimeGridSlatCellProps> {
  render() {
    let { props, context } = this
    let { slatMeta } = props
    let { options } = context
    let renderProps: SlotLaneContentArg = {
      time: slatMeta.time,
      date: context.dateEnv.toDate(slatMeta.date),
      view: context.viewApi,
    }

    return (
      <ContentContainer
        elTag="td"
        elClasses={[
          'fc-timegrid-slot',
          'fc-timegrid-slot-lane',
          !slatMeta.isLabeled && 'fc-timegrid-slot-minor',
        ]}
        elAttrs={{
          'data-time': slatMeta.isoTimeStr,
        }}
        elRef={props.elRef}
        renderProps={renderProps}
        generatorName="slotLaneContent"
        customGenerator={options.slotLaneContent}
        classNameGenerator={options.slotLaneClassNames}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      />
    )
  }
}
