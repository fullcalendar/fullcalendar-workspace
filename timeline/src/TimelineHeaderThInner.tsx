import { createElement, BaseComponent, DateMarker, ContentHook, ViewApi, DateEnv } from '@fullcalendar/common'

export interface TimelineHeaderThInnerProps {
  hookProps: HookProps
  isSticky: boolean
  navLinkAttrs: object | null
}

export class TimelineHeaderThInner extends BaseComponent<TimelineHeaderThInnerProps> {
  render() {
    let { props, context } = this

    return (
      <ContentHook hookProps={props.hookProps} content={context.options.slotLabelContent} defaultContent={renderInnerContent}>
        {(innerElRef, innerContent) => (
          <a
            ref={innerElRef}
            className={'fc-timeline-slot-cushion fc-scrollgrid-sync-inner' + (props.isSticky ? ' fc-sticky' : '')}
            {...props.navLinkAttrs}
          >
            {innerContent}
          </a>
        )}
      </ContentHook>
    )
  }
}

function renderInnerContent(props) { // TODO: add types
  return props.text
}

// hook props
// ----------

export interface HookPropsInput {
  level: number
  dateMarker: DateMarker
  text: string
  dateEnv: DateEnv
  viewApi: ViewApi
}

export interface HookProps {
  level: number
  date: DateMarker // localized
  view: ViewApi
  text: string
}

export function refineHookProps(input: HookPropsInput): HookProps {
  return {
    level: input.level,
    date: input.dateEnv.toDate(input.dateMarker),
    view: input.viewApi,
    text: input.text,
  }
}
