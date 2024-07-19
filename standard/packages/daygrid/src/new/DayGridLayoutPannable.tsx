import {
  DateComponent,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  NewScroller,
  NewScrollerInterface,
  NewScrollerSyncerInterface,
  getStickyFooterScrollbar,
  getStickyHeaderDates,
  setRef,
  getIsHeightAuto,
} from '@fullcalendar/core/internal'
import { ComponentChild, Fragment, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { DayGridRows } from './DayGridRows.js'
import { TableSeg } from '../TableSeg.js'

export interface DayGridLayoutPannableProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: HeaderCellModel[][]
  renderHeaderContent: (model: HeaderCellModel, tier: number) => ComponentChild
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
  scrollerRef?: Ref<NewScrollerInterface>
  rowHeightsRef?: Ref<{ [key: string]: number }>
}

interface DayGridViewState {
  width?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayoutPannable<HeaderCellModel, HeaderCellKey> extends DateComponent<DayGridLayoutPannableProps<HeaderCellModel, HeaderCellKey>, DayGridViewState> {
  headerScrollerRef = createRef<NewScroller>()
  bodyScrollerRef = createRef<NewScroller>()
  syncedScroller: NewScrollerSyncerInterface

  render() {
    const { props, state, context } = this
    const { options } = context

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    const colCnt = props.cellRows[0].length
    const [canvasWidth, colWidth, colActualWidth] = computeColWidth(colCnt, state.width)

    return (
      <Fragment>
        {options.dayHeaders && (
          <NewScroller
            horizontal
            hideBars
            elClassName={stickyHeaderDates && 'fc-newnew-sticky'}
            ref={this.headerScrollerRef}
          >
            <div
              className='fc-newnew-header'
              style={{
                width: canvasWidth,
                paddingLeft: state.leftScrollbarWidth,
                paddingRight: state.rightScrollbarWidth,
              }}
            >
              {props.headerTiers.map((cells, tierNum) => (
                <div key={tierNum} class='fc-newnew-row'>
                  {cells.map((cell) => (
                    <Fragment key={props.getHeaderModelKey(cell)}>
                      {props.renderHeaderContent(cell, tierNum)}
                    </Fragment>
                  ))}
                </div>
              ))}
            </div>
          </NewScroller>
        )}
        <NewScroller
          horizontal
          vertical={verticalScrollbars}
          hideBars={stickyFooterScrollbar}
          onWidth={this.handleWidth}
          onLeftScrollbarWidth={this.handleLeftScrollbarWidth}
          onRightScrollbarWidth={this.handleRightScrollbarWidth}
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
            eventSelection={props.eventSelection}
            eventDrag={props.eventDrag}
            eventResize={props.eventResize}

            // dimensions
            colWidth={colWidth}
            colActualWidth={colActualWidth}
            width={canvasWidth}

            // refs
            rowHeightsRef={props.rowHeightsRef}
          />
        </NewScroller>
        {Boolean(stickyFooterScrollbar) && (
          <NewScroller horizontal>
            <div style={{ width: canvasWidth }} />
          </NewScroller>
        )}
      </Fragment>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    this.initScrollers()
  }

  componentDidUpdate(): void {
    this.updateScrollers()
  }

  componentWillUnmount(): void {
    this.destroyScrollers()
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

  initScrollers() {
    // this.syncedScroller = new NewScrollerSyncer() // TODO: somehow get NewScrollerSyncer from plugin system
    setRef(this.props.scrollerRef, this.syncedScroller)
  }

  updateScrollers() {
    this.syncedScroller.handleChildren([
      this.headerScrollerRef.current,
      this.bodyScrollerRef.current,
    ])
  }

  destroyScrollers() {
    this.syncedScroller.destroy()
  }
}

// NOTE: returned value used for all BUT the last
function computeColWidth(colCnt: number, viewInnerWidth: number | number): [
  canvasWidth: number | undefined,
  colWidth: number | undefined,
  colActualWidth: number | undefined,
] {
  return null as any // TODO
}
