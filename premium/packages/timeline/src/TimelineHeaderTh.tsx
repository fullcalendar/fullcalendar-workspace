import {
  BaseComponent, DateRange, DateMarker, getDateMeta, getSlotClassNames,
  buildNavLinkAttrs,
  getDayClassNames, DateProfile, memoizeObjArg, ViewContext, memoize, ContentContainer, DateEnv, ViewApi,
} from '@fullcalendar/core'
import { createElement } from '@fullcalendar/core/preact'
import { TimelineDateProfile, TimelineHeaderCell } from './timeline-date-profile.js'

export interface TimelineHeaderThProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  rowLevel: number
  cell: TimelineHeaderCell
  todayRange: DateRange
  nowDate: DateMarker
  rowInnerHeight?: number
  isSticky: boolean
}

export class TimelineHeaderTh extends BaseComponent<TimelineHeaderThProps> {
  refineRenderProps = memoizeObjArg(refineRenderProps)
  buildCellNavLinkAttrs = memoize(buildCellNavLinkAttrs)

  render() {
    let { props, context } = this
    let { dateEnv, options } = context
    let { cell, dateProfile, tDateProfile } = props

    // the cell.rowUnit is f'd
    // giving 'month' for a 3-day view
    // workaround: to infer day, do NOT time

    let dateMeta = getDateMeta(cell.date, props.todayRange, props.nowDate, dateProfile)
    let renderProps = this.refineRenderProps({
      level: props.rowLevel,
      dateMarker: cell.date,
      text: cell.text,
      dateEnv: context.dateEnv,
      viewApi: context.viewApi,
    })

    return (
      <ContentContainer
        elTag="th"
        elClasses={[
          'fc-timeline-slot',
          'fc-timeline-slot-label',
          cell.isWeekStart ? 'fc-timeline-slot-em' : '',
          ...( // TODO: so slot classnames for week/month/bigger. see note above about rowUnit
            cell.rowUnit === 'time' ?
              getSlotClassNames(dateMeta, context.theme) :
              getDayClassNames(dateMeta, context.theme)
          ),
        ]}
        elAttrs={{
          colSpan: cell.colspan,
          'data-date': dateEnv.formatIso(cell.date, {
            omitTime: !tDateProfile.isTimeScale,
            omitTimeZoneOffset: true,
          }),
        }}
        renderProps={renderProps}
        generatorName="slotLabelContent"
        generator={options.slotLabelContent || renderInnerContent}
        classNameGenerator={options.slotLabelClassNames}
        didMount={options.slotLabelDidMount}
        willUnmount={options.slotLabelWillUnmount}
      >
        {(InnerContent) => (
          <div className="fc-timeline-slot-frame" style={{ height: props.rowInnerHeight }}>
            <InnerContent
              elTag="a"
              elClasses={[
                'fc-timeline-slot-cushion',
                'fc-scrollgrid-sync-inner',
                props.isSticky ? 'fc-sticky' : '',
              ]}
              elAttrs={this.buildCellNavLinkAttrs(context, cell.date, cell.rowUnit)}
            />
          </div>
        )}
      </ContentContainer>
    )
  }
}

function buildCellNavLinkAttrs(context: ViewContext, cellDate: DateMarker, rowUnit: string): any {
  return (rowUnit && rowUnit !== 'time')
    ? buildNavLinkAttrs(context, cellDate, rowUnit)
    : {}
}

function renderInnerContent(renderProps: RenderProps) {
  return renderProps.text
}

// Render Props

export interface RenderPropsInput {
  level: number
  dateMarker: DateMarker
  text: string
  dateEnv: DateEnv
  viewApi: ViewApi
}

export interface RenderProps {
  level: number
  date: DateMarker // localized
  view: ViewApi
  text: string
}

export function refineRenderProps(input: RenderPropsInput): RenderProps {
  return {
    level: input.level,
    date: input.dateEnv.toDate(input.dateMarker),
    view: input.viewApi,
    text: input.text,
  }
}
