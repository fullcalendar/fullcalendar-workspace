import {
  BaseComponent,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  Scroller,
  ScrollerInterface,
  ScrollerSyncerInterface,
  getStickyFooterScrollbar,
  getStickyHeaderDates,
  setRef,
  getIsHeightAuto,
  getScrollerSyncerClass,
  RefMap,
  DayGridRange,
  EventRangeProps,
  FooterScrollbar,
  joinClassNames,
  Ruler,
  generateClassName,
  joinArrayishClassNames,
} from '@fullcalendar/core/internal'
import { Fragment, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { DayGridRows } from './DayGridRows.js'
import { computeColWidth } from './util.js'
import { DayGridHeader } from './DayGridHeader.js'
import { RowConfig } from '../header-tier.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface DayGridLayoutPannableProps {
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

  // dimensions
  dayMinWidth: number

  // refs
  scrollerRef?: Ref<ScrollerInterface>
  rowHeightRefMap?: RefMap<string, number>

  borderlessX: boolean
}

interface DayGridViewState {
  totalWidth?: number
  clientWidth?: number
}

export class DayGridLayoutPannable extends BaseComponent<DayGridLayoutPannableProps, DayGridViewState> {
  headerScrollerRef = createRef<Scroller>()
  bodyScrollerRef = createRef<Scroller>()
  footerScrollerRef = createRef<Scroller>()
  syncedScroller: ScrollerSyncerInterface

  render() {
    const { props, state, context } = this
    const { options } = context

    const { totalWidth, clientWidth } = state
    const endScrollbarWidth = (totalWidth != null && clientWidth != null)
      ? totalWidth - clientWidth
      : undefined

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    const colCount = props.cellRows[0].length
    const [canvasWidth, colWidth] = computeColWidth(colCount, props.dayMinWidth, clientWidth)
    const cellIsCompact = totalWidth != null &&
      totalWidth / colCount <= options.dayCompactWidth

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
            <Scroller
              horizontal
              hideScrollbars
              className={classNames.flexRow}
              ref={this.headerScrollerRef}
            >
              <DayGridHeader
                headerTiers={props.headerTiers}
                colWidth={colWidth}
                width={canvasWidth}
                cellIsCompact={cellIsCompact}
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
            </Scroller>
            <div className={joinArrayishClassNames(options.dayHeaderDividerClass)} />
          </div>
        )}
        <Scroller
          vertical={verticalScrollbars}
          horizontal
          hideScrollbars={
            stickyFooterScrollbar ||
            props.forPrint // prevents blank space in print-view on Safari
          }
          className={joinArrayishClassNames(
            options.tableBodyClass,
            props.borderlessX && classNames.borderlessX,
            // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
            // https://stackoverflow.com/a/60256345
            !props.forPrint && classNames.flexCol,
            verticalScrollbars && classNames.liquid,
          )}
          ref={this.bodyScrollerRef}
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
            colWidth={colWidth}
            width={canvasWidth}
            visibleWidth={totalWidth}
            cellIsCompact={cellIsCompact}

            // refs
            rowHeightRefMap={props.rowHeightRefMap}
          />
        </Scroller>

        {Boolean(stickyFooterScrollbar) && (
          <FooterScrollbar
            isSticky
            canvasWidth={canvasWidth}
            scrollerRef={this.footerScrollerRef}
          />
        )}

        <Ruler widthRef={this.handleTotalWidth} />
      </Fragment>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    // scroller
    const ScrollerSyncer = getScrollerSyncerClass(this.context.pluginHooks)
    this.syncedScroller = new ScrollerSyncer(true) // horizontal=true
    setRef(this.props.scrollerRef, this.syncedScroller)
    this.updateSyncedScroller()
  }

  componentDidUpdate(): void {
    // scroller
    this.updateSyncedScroller()
  }

  componentWillUnmount(): void {
    // scroller
    this.syncedScroller.destroy()
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleTotalWidth = (totalWidth: number) => {
    this.setState({ totalWidth })
  }

  handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  updateSyncedScroller() {
    this.syncedScroller.handleChildren([
      this.headerScrollerRef.current,
      this.bodyScrollerRef.current,
      this.footerScrollerRef.current,
    ])
  }
}
