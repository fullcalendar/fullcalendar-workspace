import {
  afterSize,
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  DayTableCell,
  DayGridRange,
  EventSegUiInteractionState,
  Hit,
  RefMap,
  Scroller,
  ViewContainer,
  EventRangeProps,
  joinClassNames
} from '@fullcalendar/core/internal'
import { ComponentChild, createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { DayGridLayoutNormal } from './DayGridLayoutNormal.js'
import { DayGridLayoutPannable } from './DayGridLayoutPannable.js'
import { computeTopFromDate } from './util.js'

export interface DayGridLayoutProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

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
  fgEventSegs: (DayGridRange & EventRangeProps)[]
  bgEventSegs: (DayGridRange & EventRangeProps)[]
  businessHourSegs: (DayGridRange & EventRangeProps)[]
  dateSelectionSegs: (DayGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<DayGridRange> | null
  eventResize: EventSegUiInteractionState<DayGridRange> | null
  eventSelection: string
}

export class DayGridLayout<HeaderCellModel, HeaderCellKey> extends BaseComponent<DayGridLayoutProps<HeaderCellModel, HeaderCellKey>> {
  // ref
  private scrollerRef = createRef<Scroller>()
  private rowHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.updateScrollY)
  })

  // internal
  private scrollDate: DateMarker | null = null

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
        className={joinClassNames(props.className, 'fc-border fc-flex-column')}
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
    this.resetScroll()
    this.scrollerRef.current.addScrollEndListener(this.clearScroll)
  }

  componentDidUpdate(prevProps: DayGridLayoutProps<unknown, unknown>) {
    if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
      this.resetScroll()
    }
  }

  componentWillUnmount() {
    this.scrollerRef.current.removeScrollEndListener(this.clearScroll)
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  resetScroll() {
    this.scrollDate = this.props.dateProfile.currentDate
    this.updateScrollY()

    // updateScrollX
    const scroller = this.scrollerRef.current
    scroller.scrollTo({ x: 0 })
  }

  updateScrollY = () => {
    const rowHeightMap = this.rowHeightRefMap.current
    const scroller = this.scrollerRef.current

    // Since updateScrollY is called by rowHeightRefMap, could be called with null during cleanup,
    // and the scroller might not exist
    if (scroller && this.scrollDate) {
      let scrollTop = computeTopFromDate(
        this.scrollDate,
        this.props.cellRows,
        rowHeightMap,
        1, // HACK to consider *outer* height to include border
      )

      if (scrollTop != null) {
        if (scrollTop) {
          scrollTop++ // clear top border
        }
        scroller.scrollTo({ y: scrollTop })
      }
    }
  }

  clearScroll = () => {
    this.scrollDate = null
  }
}
