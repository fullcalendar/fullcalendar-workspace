import {
  h, BaseComponent, ComponentContext, DateProfile, Fragment, DateRange, DateMarker, getDateMeta, getSlotClassNames, buildNavLinkData, buildHookClassNameGenerator, MountHook, ContentHook, ViewApi
} from '@fullcalendar/core'
import { TimelineDateProfile, TimelineHeaderCell } from './timeline-date-profile'


export interface TimelineHeaderRowsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  rowInnerHeights?: number[]
}

export default class TimelineHeaderRows extends BaseComponent<TimelineHeaderRowsProps> {

  render(props: TimelineHeaderRowsProps, state: {}, context: ComponentContext) {
    let { tDateProfile, rowInnerHeights } = props
    let { cellRows } = tDateProfile

    return (
      <Fragment>
        {cellRows.map((rowCells, i) => {
          let isLast = i === cellRows.length - 1
          let isChrono = tDateProfile.isTimeScale && isLast // the final row, with times?

          return (
            <tr class={(isChrono ? 'fc-timeline-header-row-chrono' : '')}>
              {rowCells.map((cell) => (
                <TimelineHeaderTh
                  key={cell.date.toISOString()}
                  cell={cell}
                  tDateProfile={tDateProfile}
                  todayRange={props.todayRange}
                  nowDate={props.nowDate}
                  rowInnerHeight={rowInnerHeights && rowInnerHeights[i]}
                  isSticky={!isLast}
                />
              ))}
            </tr>
          )
        })}
      </Fragment>
    )
  }

}


interface TimelineHeaderThProps {
  tDateProfile: TimelineDateProfile
  cell: TimelineHeaderCell
  todayRange: DateRange
  nowDate: DateMarker
  rowInnerHeight?: number
  isSticky: boolean
}

class TimelineHeaderTh extends BaseComponent<TimelineHeaderThProps> {

  buildClassNames = buildHookClassNameGenerator('slotLabel')


  render(props: TimelineHeaderThProps, state: {}, context: ComponentContext) {
    let { dateEnv, options } = context
    let { cell, tDateProfile } = props

    let classNames = [ 'fc-timeline-slot', 'fc-timeline-slot-label' ].concat(getSlotClassNames(
      getDateMeta(cell.date, props.todayRange, props.nowDate),
      context.theme
    ))

    if (cell.isWeekStart) {
      classNames.push('fc-timeline-slot-em')
    }

    let navLinkData = (options.navLinks && cell.rowUnit && cell.rowUnit !== 'time')
      ? buildNavLinkData(cell.date, cell.rowUnit)
      : null

    let hookPropOrigin: HookPropOrigin = {
      date: cell.date,
      text: cell.text,
      navLinkData
    }
    let hookProps = massageHookProps(hookPropOrigin, context)

    let customClassNames = this.buildClassNames(hookProps, context, null, hookPropOrigin)

    return (
      <MountHook name='slotLabel' hookProps={hookProps}>
        {(rootElRef) => (
          <th
            ref={rootElRef}
            class={classNames.concat(customClassNames).join(' ')}
            data-date={dateEnv.formatIso(cell.date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })}
            colSpan={cell.colspan}
          >
            <div className='fc-timeline-slot-frame' style={{ height: props.rowInnerHeight }}>
              <TimelineHeaderThInner {...hookPropOrigin} isSticky={props.isSticky} />
            </div>
          </th>
        )}
      </MountHook>
    )
  }

}


interface TimelineHeaderThInnerProps extends HookPropOrigin {
  isSticky: boolean
}

class TimelineHeaderThInner extends BaseComponent<TimelineHeaderThInnerProps> {

  render(props: TimelineHeaderThInnerProps, state: {}, context: ComponentContext) {
    let hookProps = massageHookProps(props, context)

    return (
      <ContentHook name='slotLabel' hookProps={hookProps} defaultContent={renderInnerContent}>
        {(innerElRef, innerContent) => (
          <div className={'fc-timeline-slot-cushion fc-scrollgrid-sync-inner' + (props.isSticky ? ' fc-sticky' : '')} ref={innerElRef}>
            {innerContent}
          </div>
        )}
      </ContentHook>
    )
  }

  // componentDidMount() {
  //   console.log('didmount')
  // }

  // componentDidUpdate() {
  //   console.log('didupdate')
  // }

  // componentWillUnmount() {
  //   console.log('willunmount')
  // }

}

function renderInnerContent(props) { // TODO: add types
  // console.log('renderInnerContent')
  return (
    <a data-navlink={props.navLinkData}>
      {props.text}
    </a>
  )
}


interface HookProps {
  date: DateMarker // localized
  view: ViewApi
  text: string
  navLinkData?: string
}

interface HookPropOrigin {
  date: DateMarker // UTC
  text: string
  navLinkData?: string
}

function massageHookProps(input: HookPropOrigin, context: ComponentContext): HookProps {
  return {
    date: context.dateEnv.toDate(input.date),
    view: context.view,
    text: input.text,
    navLinkData: input.navLinkData
  }
}
