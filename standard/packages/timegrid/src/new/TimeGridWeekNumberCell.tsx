import { BaseComponent, DateProfile, WeekNumberContainer, buildNavLinkAttrs, createFormatter, diffDays } from "@fullcalendar/core/internal"
import { Ref, createElement } from '@fullcalendar/core/preact'

export interface TimeGridWeekNumberCellProps {
  dateProfile: DateProfile
  elRef?: Ref<HTMLElement>
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'short' })

export class TimeGridWeekNumberCell extends BaseComponent<TimeGridWeekNumberCellProps> {
  render() {
    let { dateProfile } = this.props
    let range = dateProfile.renderRange
    let dayCnt = diffDays(range.start, range.end)

    // only do in day views (to avoid doing in week views that dont need it)
    let navLinkAttrs = (dayCnt === 1)
      ? buildNavLinkAttrs(this.context, range.start, 'week')
      : {}

    return (
      <WeekNumberContainer
        elTag="th"
        elClasses={[
          'fc-timegrid-axis',
          'fc-scrollgrid-shrink',
        ]}
        elAttrs={{
          'aria-hidden': true,
        }}
        elRef={this.props.elRef}
        date={range.start}
        defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
      >
        {(InnerContent) => (
          <div
            className={[
              'fc-timegrid-axis-frame',
              'fc-scrollgrid-shrink-frame',
              'fc-timegrid-axis-frame-liquid',
            ].join(' ')}
            style={{ /*height: frameHeight !!! */ }}
          >
            <InnerContent
              elTag="a"
              elClasses={[
                'fc-timegrid-axis-cushion',
                'fc-scrollgrid-shrink-cushion',
                'fc-scrollgrid-sync-inner',
              ]}
              elAttrs={navLinkAttrs}
            />
          </div>
        )}
      </WeekNumberContainer>
    )
  }
}
