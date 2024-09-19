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
} from '@fullcalendar/core/internal'
import { ComponentChild, Fragment, Ref, createElement } from '@fullcalendar/core/preact'
import { DayGridRows } from './DayGridRows.js'
import { TableSeg } from '../TableSeg.js'
import { DayGridHeader } from './DayGridHeader.js'

export interface DayGridLayoutNormalProps<HeaderCellModel, HeaderCellKey> {
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
    colWidth: number | undefined,
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

  // refs
  scrollerRef?: Ref<ScrollerInterface>
  rowHeightRefMap?: RefMap<string, number>
}

interface DayGridViewState {
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayoutNormal<HeaderCellModel, HeaderCellKey> extends BaseComponent<DayGridLayoutNormalProps<HeaderCellModel, HeaderCellKey>, DayGridViewState> {
  render() {
    const { props, state, context } = this
    const { options } = context

    const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    return (
      <Fragment>
        {options.dayHeaders && (
          <DayGridHeader
            headerTiers={props.headerTiers}
            renderHeaderContent={props.renderHeaderContent}
            getHeaderModelKey={props.getHeaderModelKey}

            // render hooks
            extraClassNames={[
              stickyHeaderDates ? 'fcnew-sticky-header' : '',
            ]}

            // dimensions
            paddingLeft={state.leftScrollbarWidth}
            paddingRight={state.rightScrollbarWidth}
          />
        )}
        <Scroller
          vertical={verticalScrollbars}
          leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
          rightScrollbarWidthRef={this.handleRightScrollbarWidth}
          elClassNames={['fcnew-rowgroup', 'fcnew-daygrid-main']}
          ref={this.handleScroller}
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

            // refs
            rowHeightRefMap={props.rowHeightRefMap}
          />
        </Scroller>
      </Fragment>
    )
  }

  handleScroller = (scroller: Scroller) => {
    setRef(this.props.scrollerRef, scroller)
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
  }
}
