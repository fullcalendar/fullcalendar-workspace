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

export interface DayGridLayoutNormalProps<HeaderCellModel, HeaderCellKey> {
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
}

interface DayGridViewState {
  viewInnerWidth?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
}

export class DayGridLayoutNormal<HeaderCellModel, HeaderCellKey> extends DateComponent<DayGridLayoutNormalProps<HeaderCellModel, HeaderCellKey>, DayGridViewState> {
  render() {
    const { props, state, context } = this
    const { options } = context
    const stickyHeaderDates = getStickyHeaderDates(options)

    return (
      <Fragment>
        <div
          className={[
            'fc-newnew-header',
            stickyHeaderDates && 'fc-newnew-sticky',
          ].join(' ')}
          style={{
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
        <NewScroller
          vertical={!props.isHeightAuto}
          onWidth={this.handleViewInnerWidth}
        >
          <DayGridRows
            {...props.dayGridRowsProps}
            viewWidth={state.viewInnerWidth}
            rowPositionsRef={props.rowPositionsRef}
          />
        </NewScroller>
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
