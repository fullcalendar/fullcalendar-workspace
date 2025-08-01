import {
  BaseComponent,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  Scroller,
  ScrollerInterface,
  getStickyHeaderDates,
  getIsHeightAuto,
  setRef,
  RefMap,
  DayGridRange,
  EventRangeProps,
  joinClassNames,
  Ruler,
  generateClassName,
  joinArrayishClassNames,
} from '@fullcalendar/core/internal'
import { Fragment, Ref, createElement } from '@fullcalendar/core/preact'
import { DayGridRows } from './DayGridRows.js'
import { DayGridHeader } from './DayGridHeader.js'
import { RowConfig } from '../header-tier.js'
import classNames from '@fullcalendar/core/internal-classnames'
import { narrowDayHeaderWidth } from './util.js'

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
  noEdgeEffects: boolean
}

interface DayGridViewState {
  totalWidth?: number
  clientWidth?: number
}

export class DayGridLayoutNormal extends BaseComponent<DayGridLayoutNormalProps, DayGridViewState> {
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
    const cellIsCompact = cellWidth != null && cellWidth <= options.dayCompactWidth
    const cellIsNarrow = cellWidth != null && cellWidth <= narrowDayHeaderWidth

    return (
      <Fragment>
        {options.dayHeaders && (
          <div className={joinClassNames(
            generateClassName(options.tableHeaderClass, {
              isSticky: stickyHeaderDates,
            }),
            props.borderlessX && classNames.borderlessX,
            classNames.printHeader,
            stickyHeaderDates && classNames.tableHeaderSticky,
          )}>
            <div className={classNames.flexRow}>
              <DayGridHeader
                headerTiers={props.headerTiers}
                cellIsCompact={cellIsCompact}
                cellIsNarrow={cellIsNarrow}
                cellIsSticky={false}
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
            <div className={generateClassName(options.dayHeaderDividerClass, { isSticky: false })} />
          </div>
        )}
        <Scroller
          vertical={verticalScrollbars}
          className={joinArrayishClassNames(
            options.tableBodyClass,
            props.borderlessX && classNames.borderlessX,
            stickyHeaderDates && classNames.borderlessTop,
            (stickyHeaderDates || props.noEdgeEffects) && classNames.noEdgeEffects,
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
            cellIsCompact={cellIsCompact}

            // refs
            rowHeightRefMap={props.rowHeightRefMap}
          />
        </Scroller>
        <Ruler widthRef={this.handleTotalWidth} />
      </Fragment>
    )
  }

  private handleScroller = (scroller: Scroller | null) => {
    setRef(this.props.scrollerRef, scroller)
  }

  private handleTotalWidth = (totalWidth: number) => {
    this.setState({ totalWidth })
  }

  private handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }
}
