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
} from '@fullcalendar/core/internal'
import { ComponentChild, Fragment, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { DayGridRows } from './DayGridRows.js'
import { TableSeg } from '../TableSeg.js'
import { computeColWidth } from './util.js'
import { DayGridHeader } from './DayGridHeader.js'

export interface DayGridLayoutPannableProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: HeaderCellModel[][]
  renderHeaderContent: (
    model: HeaderCellModel,
    tier: number,
    innerHeightRef: Ref<number> | undefined, // unused
    colWidth: number | undefined
  ) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  // body content
  fgEventSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  businessHourSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  eventSelection: string

  // dimensions
  dayMinWidth: number

  // refs
  scrollerRef?: Ref<ScrollerInterface>
  rowHeightRefMap?: RefMap<string, number>
}

interface DayGridViewState {
  width?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayoutPannable<HeaderCellModel, HeaderCellKey> extends BaseComponent<DayGridLayoutPannableProps<HeaderCellModel, HeaderCellKey>, DayGridViewState> {
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
    const [canvasWidth, colWidth] = computeColWidth(colCnt, props.dayMinWidth, state.width)

    return (
      <Fragment>
        {options.dayHeaders && (
          <Scroller
            horizontal
            hideScrollbars
            elClassNames={[stickyHeaderDates ? 'fcnew-sticky-header' : '']}
            ref={this.headerScrollerRef}
          >
            <DayGridHeader
              headerTiers={props.headerTiers}
              renderHeaderContent={props.renderHeaderContent}
              getHeaderModelKey={props.getHeaderModelKey}

              // dimensions
              colWidth={colWidth}
              width={canvasWidth}
              paddingLeft={state.leftScrollbarWidth}
              paddingRight={state.rightScrollbarWidth}
            />
          </Scroller>
        )}
        <Scroller
          vertical={verticalScrollbars}
          horizontal
          hideScrollbars={stickyFooterScrollbar}
          widthRef={this.handleWidth}
          leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
          rightScrollbarWidthRef={this.handleRightScrollbarWidth}
          elClassNames={['fcnew-rowgroup', 'fcnew-daygrid-main', 'fcnew-flex-grow']}
          ref={this.bodyScrollerRef}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={props.cellRows}
            forPrint={props.forPrint}
            isHitComboAllowed={props.isHitComboAllowed}

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
          <Scroller
            ref={this.footerScrollerRef}
            horizontal
            elClassNames={['fcnew-sticky-footer']}
            elStyle={{
              marginTop: '-1px', // HACK
            }}
          >
            <div
              style={{
                boxSizing: 'content-box',
                width: canvasWidth,
                height: '1px', // HACK
              }}
            />
          </Scroller>
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

  handleWidth = (width: number) => {
    this.setState({ width })
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  updateSyncedScroller() {
    const { isRtl } = this.context

    this.syncedScroller.handleChildren([
      this.headerScrollerRef.current,
      this.bodyScrollerRef.current,
      this.footerScrollerRef.current,
    ], isRtl)
  }
}
