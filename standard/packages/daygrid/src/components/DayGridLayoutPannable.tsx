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

  borderX: boolean
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

    const colCnt = props.cellRows[0].length
    const [canvasWidth, colWidth] = computeColWidth(colCnt, props.dayMinWidth, clientWidth)

    return (
      <Fragment>
        {options.dayHeaders && (
          <div className={joinClassNames(
            generateClassName(options.viewHeaderClassNames, {
              borderX: props.borderX,
              isSticky: stickyHeaderDates,
            }),
            'fcu-print-header',
            stickyHeaderDates && 'fcu-table-header-sticky',
          )}>
            <Scroller
              horizontal
              hideScrollbars
              className='fcu-flex-row'
              ref={this.headerScrollerRef}
            >
              <DayGridHeader
                headerTiers={props.headerTiers}
                colWidth={colWidth}
                width={canvasWidth}
              />
              {Boolean(endScrollbarWidth) && (
                <div
                  className={joinArrayishClassNames(
                    options.fillerClassNames,
                    options.fillerXClassNames,
                  )}
                  style={{ minWidth: endScrollbarWidth }}
                />
              )}
            </Scroller>
            <div className={joinArrayishClassNames(options.dayHeaderDividerClassNames)} />
          </div>
        )}
        <Scroller
          vertical={verticalScrollbars}
          horizontal
          hideScrollbars={
            stickyFooterScrollbar ||
            props.forPrint // prevents blank space in print-view on Safari
          }
          className={joinClassNames(
            generateClassName(options.viewBodyClassNames, {
              borderX: props.borderX,
            }),
            // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
            // https://stackoverflow.com/a/60256345
            !props.forPrint && 'fcu-flex-col',
            verticalScrollbars && 'fcu-liquid',
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
            className='fcu-grow'
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
