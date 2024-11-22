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
  StickyFooterScrollbar,
  joinClassNames,
  ScrollbarGutter,
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
}

interface DayGridViewState {
  clientWidth?: number
  endScrollbarWidth?: number
}

export class DayGridLayoutPannable extends BaseComponent<DayGridLayoutPannableProps, DayGridViewState> {
  headerScrollerRef = createRef<Scroller>()
  bodyScrollerRef = createRef<Scroller>()
  footerScrollerRef = createRef<Scroller>()
  syncedScroller: ScrollerSyncerInterface

  render() {
    const { props, state, context } = this
    const { options } = context

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    const colCnt = props.cellRows[0].length
    const [canvasWidth, colWidth] = computeColWidth(colCnt, props.dayMinWidth, state.clientWidth)

    return (
      <Fragment>
        {options.dayHeaders && (
          <Scroller
            horizontal
            hideScrollbars
            className={joinClassNames(
              'fc-daygrid-header fc-flex-row fc-border-b',
              stickyHeaderDates && 'fc-table-header-sticky',
            )}
            ref={this.headerScrollerRef}
          >
            <DayGridHeader
              headerTiers={props.headerTiers}
              colWidth={colWidth}
              width={canvasWidth}
            />
            <ScrollbarGutter width={state.endScrollbarWidth} />
          </Scroller>
        )}
        <Scroller
          vertical={verticalScrollbars}
          horizontal
          hideScrollbars={stickyFooterScrollbar}
          className={joinClassNames(
            'fc-daygrid-body fc-flex-col',
            verticalScrollbars && 'fc-liquid',
          )}
          ref={this.bodyScrollerRef}
          clientWidthRef={this.handleClientWidth}
          endScrollbarWidthRef={this.handleEndScrollbarWidth}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={props.cellRows}
            forPrint={props.forPrint}
            isHitComboAllowed={props.isHitComboAllowed}
            className='fc-grow'

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

            // refs
            rowHeightRefMap={props.rowHeightRefMap}
          />
        </Scroller>
        {Boolean(stickyFooterScrollbar) && (
          <StickyFooterScrollbar
            canvasWidth={canvasWidth}
            scrollerRef={this.footerScrollerRef}
          />
        )}
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

  handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }

  handleEndScrollbarWidth = (endScrollbarWidth: number) => {
    this.setState({ endScrollbarWidth })
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
