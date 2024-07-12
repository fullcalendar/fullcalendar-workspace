import {
  DateComponent,
  DateProfile,
  DayTableCell,
  NewScroller,
  PositionCache,
  ScrollController2,
  getStickyHeaderDates
} from '@fullcalendar/core/internal'
import { ComponentChild, Fragment, Ref, createElement } from '@fullcalendar/core/preact'
import { DayGridRows, DayGridRowsProps } from './DayGridRows.js'

export interface DayGridLayoutPannableProps<HeaderCellModel, HeaderCellKey> {
  scrollControllerRef?: Ref<ScrollController2>
  rowPositionsRef?: Ref<PositionCache>

  dateProfile: DateProfile
  cellRows: DayTableCell[][]

  headerTiers: HeaderCellModel[][]
  renderHeaderContent: (model: HeaderCellModel, tier: number) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  dayGridRowsProps: DayGridRowsProps

  forPrint: boolean
  isHeightAuto: boolean
  dayMinWidth: number
}

interface DayGridViewState {
  viewInnerWidth?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayoutPannable<HeaderCellModel, HeaderCellKey> extends DateComponent<DayGridLayoutPannableProps<HeaderCellModel, HeaderCellKey>, DayGridViewState> {
  render() {
    const { props, state, context } = this
    const { options } = context
    const colCnt = props.headerTiers[0].length

    const [colWidth, canvasWidth] = options.dayMinWidth
      ? computeColWidth(colCnt, state.viewInnerWidth)
      : undefined

    const stickyHeaderDates = getStickyHeaderDates(options)
    const stickyFooterScrollbar = props.isHeightAuto && options.stickyFooterScrollbar !== false

    return (
      <Fragment>
        <NewScroller horizontal hideBars>
          <div
            className={[
              'fc-newnew-header',
              stickyHeaderDates && 'fc-newnew-sticky',
            ].join(' ')}
            style={{
              width: canvasWidth,
              paddingLeft: state.leftScrollbarWidth,
              paddingRight: state.rightScrollbarWidth,
            }}
          >
            {props.headerTiers.map((cells, tierNum) => (
              <div class='fc-newnew-row'>
                {cells.map((cell) => {
                  props.renderHeaderContent(cell, tierNum)
                })}
              </div>
            ))}
          </div>
        </NewScroller>
        <NewScroller
          horizontal
          vertical={!props.isHeightAuto}
          hideBars={stickyFooterScrollbar}
          onWidth={this.handleViewInnerWidth}
          onLeftScrollbarWidth={this.handleLeftScrollbarWidth}
          onRightScrollbarWidth={this.handleRightScrollbarWidth}
        >
          <DayGridRows
            {...props.dayGridRowsProps}
            colWidth={colWidth}
            viewWidth={canvasWidth /* is this right??? */}
            rowPositionsRef={props.rowPositionsRef}
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

  handleViewInnerWidth = (viewInnerWidth: number) => {
    this.setState({
      viewInnerWidth,
    })
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({
      leftScrollbarWidth,
    })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({
      rightScrollbarWidth,
    })
  }
}

// NOTE: returned value used for all BUT the last
function computeColWidth(colCnt: number, viewInnerWidth: number | number): [
  colWidth: number | undefined,
  totalWidth: number | undefined
] {
  return null as any // TODO
}
