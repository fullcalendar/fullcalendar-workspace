import {
  h, isInt, BaseComponent,
  ComponentContext, DateMarker, Ref, setRef, getDayClassNames, getSlatClassNames, DateRange, getDateMeta, getDayMeta, DateProfile, MountHook, ClassNamesHook, InnerContentHook
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineSlatCellProps {
  date: DateMarker
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  isEm: boolean
  elRef?: Ref<HTMLTableCellElement>
}


export default class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {


  render(props: TimelineSlatCellProps, state: {}, context: ComponentContext) {
    let { dateEnv } = context
    let { date, tDateProfile, isEm } = props // TODO: destructure in signature! do elsewhere!
    let dateMeta
    let standardClassNames: string[]

    if (tDateProfile.isTimeScale) {
      dateMeta = getDateMeta(date, props.todayRange, props.nowDate)
      standardClassNames = getSlatClassNames(dateMeta, context.theme)

      standardClassNames.push(
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedRange.start,
          date,
          tDateProfile.labelInterval
        )) ?
          'fc-major' :
          'fc-minor'
      )

    } else {
      dateMeta = getDayMeta(date, props.todayRange, props.dateProfile)
      standardClassNames = getDayClassNames(dateMeta, context.theme)
    }

    if (isEm) {
      standardClassNames.push('fc-em-cell')
    }

    let dateStr = dateEnv.formatIso(date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })
    let staticProps = {
      date,
      view: context.view
    }
    let dynamicProps = {
      ...staticProps,
      ...dateMeta
    }

    return (
      <MountHook
        name='dateCell'
        handlerProps={staticProps}
        content={(rootElRef: Ref<HTMLTableCellElement>) => (
          <ClassNamesHook
            name='dateCell'
            handlerProps={dynamicProps}
            content={(customClassNames) => (
              <td
                ref={(el: HTMLElement | null) => {
                  setRef(this.handleEl, el)
                  setRef(rootElRef, el)
                }}
                key={dateStr /* fresh rerender for new date, mostly because of dayRender */}
                data-date={dateStr}
                class={standardClassNames.concat(customClassNames).join(' ')}
              >
                <InnerContentHook
                  name='dateCell'
                  innerProps={dynamicProps}
                  outerContent={(innerContentParentRef, innerContent) => (
                    <div ref={innerContentParentRef}>{innerContent}</div>
                  )}
                />
              </td>
            )}
          />
        )}
      />
    )
  }


  handleEl = (el: HTMLElement | null) => {
    let { props } = this

    if (el) {
      let { calendar, view, dateEnv } = this.context

      calendar.publiclyTrigger('dayRender', [
        {
          date: dateEnv.toDate(props.date),
          el,
          view
        }
      ])
    }

    setRef(props.elRef, el)
  }

}
