import {
  h, BaseComponent, ComponentContext, Fragment, DateRange, DateMarker, getDateMeta, getSlotClassNames, buildNavLinkData, buildHookClassNameGenerator, MountHook, ContentHook, ViewApi, getDayClassNames, DateProfile
} from '@fullcalendar/core'
import { TimelineDateProfile, TimelineHeaderCell } from './timeline-date-profile'


export interface TimelineHeaderRowsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  rowInnerHeights?: number[]
}

export class TimelineHeaderRows extends BaseComponent<TimelineHeaderRowsProps> {

  render(props: TimelineHeaderRowsProps, state: {}, context: ComponentContext) {
    let { dateProfile, tDateProfile, rowInnerHeights } = props
    let { cellRows } = tDateProfile

    return (
      <Fragment>
        {cellRows.map((rowCells, i) => {
          let isLast = i === cellRows.length - 1
          let isChrono = tDateProfile.isTimeScale && isLast // the final row, with times?

          return (
            <tr className={(isChrono ? 'fc-timeline-header-row-chrono' : '')}>
              {rowCells.map((cell) => (
                <TimelineHeaderTh
                  key={cell.date.toISOString()}
                  cell={cell}
                  dateProfile={dateProfile}
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
  dateProfile: DateProfile
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

    let hookPropOrigin: HookPropOrigin = {
      date: cell.date,
      text: cell.text
    }
    let hookProps = massageHookProps(hookPropOrigin, context)

    let customClassNames = this.buildClassNames(hookProps, context, null, hookPropOrigin)

    return (
      <MountHook name='slotLabel' hookProps={hookProps}>
        {(rootElRef) => (
          <th
            ref={rootElRef}
            className={classNames.concat(customClassNames).join(' ')}
            data-date={dateEnv.formatIso(cell.date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })}
            colSpan={cell.colspan}
          >
            <div className='fc-timeline-slot-frame' style={{ height: props.rowInnerHeight }}>
              <TimelineHeaderThInner
                {...hookPropOrigin}
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


interface TimelineHeaderThInnerProps extends HookPropOrigin {
  isSticky: boolean
  navLinkData: string | null
}

class TimelineHeaderThInner extends BaseComponent<TimelineHeaderThInnerProps> {

  render(props: TimelineHeaderThInnerProps, state: {}, context: ComponentContext) {
    let hookProps = massageHookProps(props, context)

    return (
      <ContentHook name='slotLabel' hookProps={hookProps} defaultContent={renderInnerContent}>
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


interface HookProps {
  date: DateMarker // localized
  view: ViewApi
  text: string
}

interface HookPropOrigin {
  date: DateMarker // UTC
  text: string
}

function massageHookProps(input: HookPropOrigin, context: ComponentContext): HookProps {
  return {
    date: context.dateEnv.toDate(input.date),
    view: context.viewApi,
    text: input.text
  }
}
