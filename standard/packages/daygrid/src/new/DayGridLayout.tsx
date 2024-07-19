import {
  DateComponent,
  DateMarker,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  NewScroller,
  ScrollRequest,
  ScrollResponder,
  ViewContainer
} from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef } from '@fullcalendar/core/preact'
import { TableSeg } from '../TableSeg.js'
import { DayGridLayoutNormal } from './DayGridLayoutNormal.js'
import { DayGridLayoutPannable } from './DayGridLayoutPannable.js'

export interface DayGridLayoutProps<HeaderCellModel, HeaderCellKey> {
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
}

export class DayGridLayout<HeaderCellModel, HeaderCellKey> extends DateComponent<DayGridLayoutProps<HeaderCellModel, HeaderCellKey>> {
  // ref
  private scrollerRef = createRef<NewScroller>()
  private rowHeightsRef = createRef<{ [key: string]: number }>()

  // internal
  private scrollResponder: ScrollResponder

  render() {
    const { props, context } = this
    const { options } = context

    const commonLayoutProps = {
      ...props,
      scrollerRef: this.scrollerRef,
      rowHeightsRef: this.rowHeightsRef,
    }

    return (
      <ViewContainer
        viewSpec={context.viewSpec}
        elClasses={['fc-daygrid']}
      >
        <div className='fc-newnew-bordered'>
          {options.dayMinWidth ? (
            <DayGridLayoutPannable {...commonLayoutProps} dayMinWidth={options.dayMinWidth} />
          ) : (
            <DayGridLayoutNormal {...commonLayoutProps} />
          )}
        </div>
      </ViewContainer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
  }

  componentDidUpdate(prevProps: DayGridLayoutProps<HeaderCellModel, HeaderCellKey>) {
    this.scrollResponder.update(prevProps.dateProfile !== this.props.dateProfile)
  }

  componentWillUnmount() {
    this.scrollResponder.detach()
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  /*
  Called when component loaded and positioning ready, as well as when dateProfile is updated
  Does not use scrollRequest.time
  */
  handleScrollRequest = (scrollRequest: ScrollRequest) => {
    const scroller = this.scrollerRef.current
    const rowHeights = this.rowHeightsRef.current

    if (rowHeights) {
      const scrollTop = computeScrollTop(
        this.props.cellRows,
        rowHeights,
        this.props.dateProfile.currentDate
      )
      scroller.scrollTo({ y: scrollTop })
      return true
    }

    return false
  }
}

function computeScrollTop(
  cellRows: DayTableCell[][],
  rowHeights: { [key: string]: number },
  currentDate: DateMarker,
): number {
  // TODO: iterate over rowHeights, accumulate, find the row that intersects with currentDate
  return null as any
}
