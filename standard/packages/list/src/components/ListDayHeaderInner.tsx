import { BaseComponent, buildNavLinkAttrs, ContentContainer, DateFormatter, DateMarker, DateMeta, renderText } from "@fullcalendar/core/internal";
import { createElement } from '@fullcalendar/core/preact'
import { ListDayHeaderInnerArg } from '../structs.js'

export interface ListDayHeaderInnerProps {
  dayDate: DateMarker
  dayFormat: DateFormatter
  isTabbable: boolean
  dateMeta: DateMeta
}

export class ListDayHeaderInner extends BaseComponent<ListDayHeaderInnerProps> {
  render() {
    const { props, context } = this
    const { options } = context
    const [text, textParts] = context.dateEnv.format(props.dayDate, props.dayFormat)

    const renderProps: ListDayHeaderInnerArg = {
      ...props.dateMeta,
      view: context.viewApi,
      text,
      textParts,
    }

    const navLinkAttrs = options.navLinks
      ? buildNavLinkAttrs(this.context, props.dayDate, undefined, text, this.props.isTabbable)
      : {}

    return (
      <ContentContainer
        tag="div"
        attrs={navLinkAttrs}
        renderProps={renderProps}
        generatorName="listDayHeaderContent"
        customGenerator={options.listDayHeaderContent}
        defaultGenerator={renderText}
        classNameGenerator={options.listDayHeaderInnerClassNames}
      />
    )
  }
}
