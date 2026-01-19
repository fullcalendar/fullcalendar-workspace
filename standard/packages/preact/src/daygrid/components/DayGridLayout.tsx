import { afterSize } from '../../component-util/resize-observer'
import { BaseComponent } from '../../vdom-util'
import { DateMarker, DateRange } from '@full-ui/headless-calendar'
import { DateProfile } from '../../DateProfileGenerator'
import { DayTableCell, DayGridRange } from '../../common/DayTableModel'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { Hit } from '../../interactions/hit'
import { RefMap } from '../../util/RefMap'
import { Scroller } from '../../scrollgrid/Scroller'
import { ViewContainer } from '../../common/ViewContainer'
import { EventRangeProps } from '../../component-util/event-rendering'
import { joinArrayishClassNames } from '../../util/html'
import { createRef } from 'react'
import { DayGridLayoutNormal } from './DayGridLayoutNormal'
import { DayGridLayoutPannable } from './DayGridLayoutPannable'
import { computeTopFromDate } from './util'
import { RowConfig } from '../header-tier'
import classNames from '../../styles.module.css'

export interface DayGridLayoutProps {
  labelId: string | undefined
  labelStr: string | undefined

  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

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

  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  noEdgeEffects: boolean
}

export class DayGridLayout extends BaseComponent<DayGridLayoutProps> {
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
        attrs={{
          role: 'grid',
          'aria-rowcount': props.headerTiers.length + props.cellRows.length,
          'aria-colcount': props.cellRows[0].length,
          'aria-labelledby': props.labelId,
          'aria-label': props.labelStr,
        }}
        className={joinArrayishClassNames(
          props.className,
          classNames.printRoot, // either flexCol or table
          options.tableClass,
        )}
        borderlessX={props.borderlessX}
        borderlessTop={props.borderlessTop}
        borderlessBottom={props.borderlessBottom}
        noEdgeEffects={props.noEdgeEffects}
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
    this.scrollerRef.current.addScrollEndListener(this.handleScrollEnd)
  }

  componentDidUpdate(prevProps: DayGridLayoutProps) {
    if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
      this.resetScroll()
    }
  }

  componentWillUnmount() {
    this.scrollerRef.current.removeScrollEndListener(this.handleScrollEnd)
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  resetScroll() {
    this.scrollDate = this.props.dateProfile.currentDate
    this.updateScrollY()

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

  handleScrollEnd = (isUser: boolean) => {
    if (isUser) {
      this.scrollDate = null
    }
  }
}
