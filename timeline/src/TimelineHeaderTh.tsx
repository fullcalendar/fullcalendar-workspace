import {
  h, BaseComponent, DateRange, DateMarker, getDateMeta, getSlotClassNames, buildNavLinkData, buildClassNameNormalizer, MountHook, ContentHook, ViewApi, getDayClassNames, DateProfile, memoizeObjArg, DateEnv
} from '@fullcalendar/common'
import { TimelineDateProfile, TimelineHeaderCell } from './timeline-date-profile'


export interface TimelineHeaderThProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  cell: TimelineHeaderCell
  todayRange: DateRange
  nowDate: DateMarker
  rowInnerHeight?: number
  isSticky: boolean
}

export class TimelineHeaderTh extends BaseComponent<TimelineHeaderThProps> {

  refineHookProps = memoizeObjArg(refineHookProps)
  normalizeClassNames = buildClassNameNormalizer<HookProps>()


  render() {
    let { props, context } = this
    let { dateEnv, options } = context
    let { cell, dateProfile, tDateProfile } = props

    // the cell.rowUnit is f'd
    // giving 'month' for a 3-day view
    // workaround: to infer day, do NOT time

    let dateMeta = getDateMeta(cell.date, props.todayRange, props.nowDate, dateProfile)

    let classNames = [ 'fc-timeline-slot', 'fc-timeline-slot-label' ].concat(
      cell.rowUnit === 'time' // TODO: so slot classnames for week/month/bigger. see note above about rowUnit
        ? getSlotClassNames(dateMeta, context.theme)
        : getDayClassNames(dateMeta, context.theme)
    )

    if (cell.isWeekStart) {
      classNames.push('fc-timeline-slot-em')
    }

    let navLinkData = (options.navLinks && cell.rowUnit && cell.rowUnit !== 'time')
      ? buildNavLinkData(cell.date, cell.rowUnit)
      : null

    let hookProps = this.refineHookProps({
      dateMarker: cell.date,
      text: cell.text,
      dateEnv: context.dateEnv,
      viewApi: context.viewApi
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
            <div className='fc-timeline-slot-frame' style={{ height: props.rowInnerHeight }}>
              <TimelineHeaderThInner
                hookProps={hookProps}
                isSticky={props.isSticky}
                navLinkData={navLinkData}
              />
            </div>
          </th>
        )}
      </MountHook>
    )
  }

}


interface TimelineHeaderThInnerProps {
  hookProps: HookProps
  isSticky: boolean
  navLinkData: string | null
}

class TimelineHeaderThInner extends BaseComponent<TimelineHeaderThInnerProps> { // doesn't need context!!!

  render() {
    let { props, context } = this

    return (
      <ContentHook hookProps={props.hookProps} content={context.options.slotLabelContent} defaultContent={renderInnerContent}>
        {(innerElRef, innerContent) => (
          <a
            data-navlink={props.navLinkData}
            className={'fc-timeline-slot-cushion fc-scrollgrid-sync-inner' + (props.isSticky ? ' fc-sticky' : '')}
            ref={innerElRef}
          >
            {innerContent}
          </a>
        )}
      </ContentHook>
    )
  }

}

function renderInnerContent(props) { // TODO: add types
  return props.text
}


// hook props
// ----------

interface RawHookProps {
  dateMarker: DateMarker
  text: string
  dateEnv: DateEnv
  viewApi: ViewApi
}

interface HookProps {
  date: DateMarker // localized
  view: ViewApi
  text: string
}

function refineHookProps(input: RawHookProps): HookProps {
  return {
    date: input.dateEnv.toDate(input.dateMarker),
    view: input.viewApi,
    text: input.text
  }
}
