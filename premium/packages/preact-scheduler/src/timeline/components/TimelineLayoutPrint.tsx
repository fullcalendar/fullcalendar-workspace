import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  BaseComponent,
  computeViewBorderless,
  DateMarker,
  DateProfile,
  DateRange,
  generateClassName,
  SlicedProps,
  ViewContainer,
  watchHeight,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createRef } from 'react'
import { TimelineDateProfile } from '../timeline-date-profile'
import { TimelineRange } from '../TimelineLaneSlicer'
import { TimelineBg } from './TimelineBg'
import { TimelineHeaderRow } from './TimelineHeaderRow'
import { TimelinePrintFg } from './TimelinePrintFg'
import { TimelineSlats } from './TimelineSlats'

export interface TimelineLayoutPrintProps {
  className?: string
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange
  slicedProps: SlicedProps<TimelineRange>
  canvasWidth: number | undefined
  slotWidth: number | undefined
  timeCanvasClipStart: number
}

interface TimelineLayoutPrintState {
  headerHeight?: number
}

export class TimelineLayoutPrint extends BaseComponent<TimelineLayoutPrintProps, TimelineLayoutPrintState> {
  state = {} as TimelineLayoutPrintState

  // refs
  private headerElRef = createRef<HTMLTableSectionElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectHeaderHeight?: () => void

  render() {
    const { props, context } = this
    const { options, viewSpec } = context
    const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)
    const { tDateProfile, nowDate, todayRange, slicedProps } = props
    const { cellRows } = tDateProfile

    const tableDisplayInfo = {
      borderlessX,
      borderlessTop,
      borderlessBottom,
      multiMonthColumns: 0,
    }
    const headerDividerClassName = generateClassName(options.slotHeaderDividerClass, {
      inTableHeader: true,
      options: { dayMinWidth: options.dayMinWidth },
    })

    return (
      <ViewContainer
        viewSpec={viewSpec}
        className={joinClassNames(
          props.className,
          classNames.rel,
          classNames.crop,
          classNames.isolate,
        )}
      >
        <div
          className={classNames.abs}
          style={{
            zIndex: 0,
            top: this.state.headerHeight ?? 0,
            // Compensates for Firefox miscomputing absolute height with repeated print headers.
            bottom: '-5%',
            insetInlineStart: 0,
            insetInlineEnd: 0,
            pointerEvents: 'none',
          }}
        >
          <TimelineSlats
            dateProfile={props.dateProfile}
            tDateProfile={tDateProfile}
            nowDate={nowDate}
            nowMs={props.nowMs}
            todayRange={todayRange}
            slotWidth={props.slotWidth}
            clipStart={props.timeCanvasClipStart}
          />
          <TimelineBg
            tDateProfile={tDateProfile}
            nowDate={nowDate}
            nowMs={props.nowMs}
            todayRange={todayRange}
            bgEventSegs={slicedProps.bgEventSegs}
            businessHourSegs={null}
            dateSelectionSegs={null}
            eventResizeSegs={null}
            slotWidth={props.slotWidth}
            clipStart={props.timeCanvasClipStart}
          />
        </div>

        <table
          className={joinClassNames(
            generateClassName(options.tableClass, tableDisplayInfo),
            classNames.printTable,
            classNames.rel,
          )}
          style={{ zIndex: 1 }}
        >
          <thead
            ref={this.headerElRef}
            className={generateClassName(options.tableHeaderClass, {
              ...tableDisplayInfo,
              isSticky: false,
            })}
          >
            <tr>
              <th className={joinClassNames(classNames.noPadding, classNames.borderNone, classNames.crop)}>
                <div
                  className={classNames.rel}
                  style={{
                    width: props.canvasWidth,
                    insetInlineStart: -props.timeCanvasClipStart,
                  }}
                >
                  {cellRows.map((cells, rowIndex) => {
                    const rowLevel = cellRows.length - rowIndex - 1

                    return (
                      <TimelineHeaderRow
                        key={rowLevel}
                        dateProfile={props.dateProfile}
                        tDateProfile={tDateProfile}
                        nowDate={nowDate}
                        nowMs={props.nowMs}
                        todayRange={todayRange}
                        rowLevel={rowLevel}
                        cells={cells}
                        slotWidth={props.slotWidth}
                      />
                    )
                  })}
                </div>
              </th>
            </tr>
            <tr>
              <th className={joinClassNames(classNames.noPadding, headerDividerClassName)} />
            </tr>
          </thead>
          <tbody
            className={generateClassName(options.tableBodyClass, tableDisplayInfo)}
          >
            <tr>
              <td
                className={joinClassNames(classNames.noPadding, classNames.borderNone)}
              >
                <div className={joinClassNames(options.timelineTopClass)} />
                <TimelinePrintFg
                  dateProfile={props.dateProfile}
                  tDateProfile={tDateProfile}
                  nowDate={nowDate}
                  nowMs={props.nowMs}
                  todayRange={todayRange}
                  fgEventSegs={slicedProps.fgEventSegs}
                  eventSelection={slicedProps.eventSelection}
                  slotWidth={props.slotWidth}
                  timeCanvasClipStart={props.timeCanvasClipStart}
                />
                <div className={joinClassNames(options.timelineBottomClass)} />
              </td>
            </tr>
          </tbody>
        </table>
      </ViewContainer>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
    this.disconnectHeaderHeight = watchHeight(this.headerElRef.current, (headerHeight) => {
      if (!this._isUnmounting && headerHeight !== this.state.headerHeight) {
        this.setState({ headerHeight })
      }
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectHeaderHeight?.()
  }
}
