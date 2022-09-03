import {
  createElement, BaseComponent, DateRange, DateMarker, getDateMeta, getSlotClassNames,
  buildNavLinkAttrs, buildClassNameNormalizer, MountHook,
  getDayClassNames, DateProfile, memoizeObjArg, ViewContext, memoize,
} from '@fullcalendar/common'
import { TimelineDateProfile, TimelineHeaderCell } from './timeline-date-profile'
import { TimelineHeaderThInner, refineHookProps, HookProps } from './TimelineHeaderThInner'

export interface TimelineHeaderThProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  rowLevel: number
  cell: TimelineHeaderCell
  todayRange: DateRange
  nowDate: DateMarker
  rowInnerHeight?: number
  isSticky: boolean
}

export class TimelineHeaderTh extends BaseComponent<TimelineHeaderThProps> {
  refineHookProps = memoizeObjArg(refineHookProps)
  normalizeClassNames = buildClassNameNormalizer<HookProps>()
  buildCellNavLinkAttrs = memoize(buildCellNavLinkAttrs)

  render() {
    let { props, context } = this
    let { dateEnv, options } = context
    let { cell, dateProfile, tDateProfile } = props

    // the cell.rowUnit is f'd
    // giving 'month' for a 3-day view
    // workaround: to infer day, do NOT time

    let dateMeta = getDateMeta(cell.date, props.todayRange, props.nowDate, dateProfile)

    let classNames = ['fc-timeline-slot', 'fc-timeline-slot-label'].concat(
      cell.rowUnit === 'time' // TODO: so slot classnames for week/month/bigger. see note above about rowUnit
        ? getSlotClassNames(dateMeta, context.theme)
        : getDayClassNames(dateMeta, context.theme),
    )

    if (cell.isWeekStart) {
      classNames.push('fc-timeline-slot-em')
    }

    let hookProps = this.refineHookProps({
      level: props.rowLevel,
      dateMarker: cell.date,
      text: cell.text,
      dateEnv: context.dateEnv,
      viewApi: context.viewApi,
    })

    let customClassNames = this.normalizeClassNames(options.slotLabelClassNames, hookProps)

    return (
      <MountHook hookProps={hookProps} didMount={options.slotLabelDidMount} willUnmount={options.slotLabelWillUnmount}>
        {(rootElRef) => (
          <th
            ref={rootElRef}
            className={classNames.concat(customClassNames).join(' ')}
            data-date={dateEnv.formatIso(cell.date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })}
            colSpan={cell.colspan}
          >
            <div className="fc-timeline-slot-frame" style={{ height: props.rowInnerHeight }}>
              <TimelineHeaderThInner
                hookProps={hookProps}
                isSticky={props.isSticky}
                navLinkAttrs={this.buildCellNavLinkAttrs(context, cell.date, cell.rowUnit)}
              />
            </div>
          </th>
        )}
      </MountHook>
    )
  }
}

function buildCellNavLinkAttrs(context: ViewContext, cellDate: DateMarker, rowUnit: string): object {
  return (rowUnit && rowUnit !== 'time')
    ? buildNavLinkAttrs(context, cellDate, rowUnit)
    : {}
}
