import { BaseComponent } from '../../component/BaseComponent'
import { buildNavLinkAttrs } from '../../common/nav-link'
import { ContentContainer } from '../../content-inject/ContentContainer'
import type { DateFormatter } from '../../datelib/formatting'
import type { DateMarker } from '@full-ui/headless-calendar'
import type { DateMeta } from '../../component-util/date-rendering'
import { findDayNumberText } from '../../util/date-format'
import { renderText } from '../../content-inject/render-functions'
import { ListDayHeaderInnerData } from '../structs'

export interface ListDayHeaderInnerProps {
  dayDate: DateMarker
  dayFormat: DateFormatter
  isTabbable: boolean
  dateMeta: DateMeta
  level: number
}

export class ListDayHeaderInner extends BaseComponent<ListDayHeaderInnerProps> {
  render() {
    const { props, context } = this
    const { options } = context
    const [text, textParts] = context.dateEnv.format(props.dayDate, props.dayFormat)

    const hasNavLink = options.navLinks
    const renderProps: ListDayHeaderInnerData = {
      ...props.dateMeta,
      view: context.viewApi,
      text,
      textParts,
      get dayNumberText() { return findDayNumberText(textParts) },
      hasNavLink,
      level: props.level,
    }

    const navLinkAttrs = hasNavLink
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
        classNameGenerator={options.listDayHeaderInnerClass}
      />
    )
  }
}
