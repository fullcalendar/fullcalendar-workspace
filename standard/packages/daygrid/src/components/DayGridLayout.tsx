import {
  BaseComponent,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  RefMap,
  Scroller,
  ScrollRequest,
  ScrollResponder,
  ViewContainer
} from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { TableSeg } from '../TableSeg.js'
import { DayGridLayoutNormal } from './DayGridLayoutNormal.js'
import { DayGridLayoutPannable } from './DayGridLayoutPannable.js'
import { computeTopFromDate } from './util.js'

export interface DayGridLayoutProps<HeaderCellModel, HeaderCellKey> {
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
    innerHeightRef: Ref<number> | undefined, // unused... why do we have it then???
    width: number | undefined, // TODO: rename to colWidth
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
}

export class DayGridLayout<HeaderCellModel, HeaderCellKey> extends BaseComponent<DayGridLayoutProps<HeaderCellModel, HeaderCellKey>> {
  // ref
  private scrollerRef = createRef<Scroller>()
  private rowHeightRefMap = new RefMap<string, number>()

  // internal
  private scrollResponder: ScrollResponder

  render() {
    const { props, context } = this
    const { options } = context

    const commonLayoutProps = {
      ...props,
      scrollerRef: this.scrollerRef,
      rowHeightRefMap: this.rowHeightRefMap,
    }

    return (
      <ViewContainer
        viewSpec={context.viewSpec}
        elClasses={['fcnew-daygrid-view', 'fcnew-flex-column', 'fcnew-border']}
      >
        {options.dayMinWidth ? (
          <DayGridLayoutPannable {...commonLayoutProps} dayMinWidth={options.dayMinWidth} />
        ) : (
          <DayGridLayoutNormal {...commonLayoutProps} />
        )}
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
  handleScrollRequest = (_scrollRequest: ScrollRequest) => {
    const scroller = this.scrollerRef.current
    const rowHeightMap = this.rowHeightRefMap.current

    const scrollTop = computeTopFromDate(
      this.props.dateProfile.currentDate,
      this.props.cellRows,
      rowHeightMap,
    )

    if (scrollTop != null) {
      scroller.scrollTo({ y: scrollTop })
      return true
    }

    return false
  }
}
