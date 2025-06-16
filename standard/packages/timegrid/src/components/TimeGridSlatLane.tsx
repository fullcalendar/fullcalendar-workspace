import { SlotLaneData } from '@fullcalendar/core'
import { BaseComponent, ContentContainer, getDateMeta, joinClassNames, memoize } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'
import { TimeSlatMeta } from '../time-slat-meta.js'

export interface TimeGridSlatLaneProps extends TimeSlatMeta {
  borderTop: boolean
}

export class TimeGridSlatLane extends BaseComponent<TimeGridSlatLaneProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps: SlotLaneData = {
      // this is a time-specific slot. not day-specific, so don't do today/nowRange
      ...this.getDateMeta(props.date, context.dateEnv),

      time: props.time,
      isMajor: false,
      isMinor: !props.isLabeled,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          'data-time': props.isoTimeStr,
        }}
        className={joinClassNames(
          classNames.tight,
          classNames.liquid,
          props.borderTop ? classNames.borderOnlyT : classNames.borderNone,
        )}
        renderProps={renderProps}
        generatorName={undefined}
        classNameGenerator={options.slotLaneClass}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      />
    )
  }
}
