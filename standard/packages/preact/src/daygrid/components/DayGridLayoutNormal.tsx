import { joinClassNames, joinArrayishClassNames } from '../../util/html'
import { BaseComponent, setRef } from '../../vdom-util'
import { DateProfile } from '../../DateProfileGenerator'
import { DateRange } from '@full-ui/headless-calendar'
import { DayTableCell, DayGridRange } from '../../common/DayTableModel'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { Hit } from '../../interactions/hit'
import { Scroller } from '../../scrollgrid/Scroller'
import { ScrollerInterface } from '../../scrollgrid/ScrollerInterface'
import { getStickyHeaderDates, getIsHeightAuto } from '../../scrollgrid/util'
import { RefMap } from '../../util/RefMap'
import { EventRangeProps } from '../../component-util/event-rendering'
import { Ruler } from '../../scrollgrid/Ruler'
import { generateClassName } from '../../content-inject/ContentContainer'
import { type Ref } from 'react'
import { DayGridRows } from './DayGridRows'
import { DayGridHeader } from './DayGridHeader'
import { RowConfig } from '../header-tier'
import classNames from '../../styles.module.css'
import { dayMicroWidth } from './util'

export interface DayGridLayoutNormalProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: RowConfig<{ text: string, isDisabled: boolean }>[]

  // body content
  fgEventSegs: (DayGridRange & EventRangeProps)[]
  bgEventSegs: (DayGridRange & EventRangeProps)[]
  businessHourSegs: (DayGridRange & EventRangeProps)[]
  dateSelectionSegs: (DayGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<DayGridRange> | null
  eventResize: EventSegUiInteractionState<DayGridRange> | null
  eventSelection: string

  // refs
  scrollerRef?: Ref<ScrollerInterface>
  rowHeightRefMap?: RefMap<string, number>

  borderlessX: boolean
  borderlessBottom: boolean
}

interface DayGridViewState {
  totalWidth?: number
  clientWidth?: number
}

export class DayGridLayoutNormal extends BaseComponent<DayGridLayoutNormalProps, DayGridViewState> {
  state = {} as DayGridViewState
  private _isUnmounting: boolean

  render() {
    const { props, state, context } = this
    const { options } = context

    const { totalWidth, clientWidth } = state

    let endScrollbarWidth = (totalWidth != null && clientWidth != null)
      ? totalWidth - clientWidth
      : undefined

    // HACK when clientWidth does NOT include body-border, compared to totalWidth
    if (endScrollbarWidth < 3) {
      endScrollbarWidth = 0
    }

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    const colCount = props.cellRows[0].length
    const cellWidth = clientWidth != null  ? clientWidth / colCount : undefined
    const cellIsMicro = cellWidth != null && cellWidth <= dayMicroWidth
    const cellIsNarrow = cellIsMicro || (cellWidth != null && cellWidth <= options.dayNarrowWidth)

    return (
      <>
        {options.dayHeaders && (
          <div className={joinClassNames(
            generateClassName(options.tableHeaderClass, {
              isSticky: stickyHeaderDates,
            }),
            classNames.printHeader, // either flexCol or table-header-group
            stickyHeaderDates && classNames.tableHeaderSticky,
          )}>
            <div className={classNames.flexRow}>
              <DayGridHeader
                headerTiers={props.headerTiers}
                cellIsNarrow={cellIsNarrow}
                cellIsMicro={cellIsMicro}
              />
              {Boolean(endScrollbarWidth) && (
                <div
                  className={joinArrayishClassNames(
                    generateClassName(options.fillerClass, { isHeader: true }),
                    classNames.borderOnlyS,
                  )}
                  style={{ minWidth: endScrollbarWidth }}
                />
              )}
            </div>
            <div
              className={generateClassName(options.dayHeaderDividerClass, {
                isSticky: stickyHeaderDates,
                options: { allDaySlot: Boolean(options.allDaySlot) },
              })}
            />
          </div>
        )}
        <Scroller
          vertical={verticalScrollbars}
          className={joinArrayishClassNames(
            generateClassName(options.tableBodyClass, {
              borderlessX: props.borderlessX,
              borderlessBottom: props.borderlessBottom,
            }),
            // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
            // https://stackoverflow.com/a/60256345
            !props.forPrint && classNames.flexCol,
            verticalScrollbars && classNames.liquid,
          )}
          ref={this.handleScroller}
          clientWidthRef={this.handleClientWidth}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={props.cellRows}
            forPrint={props.forPrint}
            isHitComboAllowed={props.isHitComboAllowed}
            className={classNames.grow}
            dayMaxEvents={props.forPrint ? undefined : options.dayMaxEvents}
            dayMaxEventRows={options.dayMaxEventRows}

            // content
            fgEventSegs={props.fgEventSegs}
            bgEventSegs={props.bgEventSegs}
            businessHourSegs={props.businessHourSegs}
            dateSelectionSegs={props.dateSelectionSegs}
            eventDrag={props.eventDrag}
            eventResize={props.eventResize}
            eventSelection={props.eventSelection}

            // dimensions
            visibleWidth={totalWidth}
            cellIsNarrow={cellIsNarrow}
            cellIsMicro={cellIsMicro}

            // refs
            rowHeightRefMap={props.rowHeightRefMap}
          />
        </Scroller>
        <Ruler widthRef={this.handleTotalWidth} />
      </>
    )
  }

  private handleScroller = (scroller: Scroller | null) => {
    setRef(this.props.scrollerRef, scroller)
  }

  componentDidMount(): void {
    this._isUnmounting = false
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
  }

  private handleTotalWidth = (totalWidth: number) => {
    if (this._isUnmounting) return
    this.setState({ totalWidth })
  }

  private handleClientWidth = (clientWidth: number) => {
    if (this._isUnmounting) return
    this.setState({ clientWidth })
  }
}
