import { joinClassNames } from '@fullcalendar/preact/public-api'
import { getPartAttr, BaseComponent } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import type { ReactNode } from 'react'

export interface ResourceIndentProps {
  level: number // assumed >=1 ... or else caller should not include in DOM
  indentWidth: number | undefined
  className?: string
  style?: any // TODO
  children?: ReactNode
}

export class ResourceIndent extends BaseComponent<ResourceIndentProps> {
  render() {
    const { props, context } = this

    return (
      <div
        className={joinClassNames(
          context.options.resourceIndentClass,
          classNames.noShrink,
          classNames.flexCol,
          classNames.alignEnd,
          props.className,
        )}
        data-fc-part={getPartAttr(context.options, 'resourceIndent')}
        style={{
          ...props.style,
          width: props.indentWidth != null
            ? props.indentWidth * props.level
            : 0,
        }}
      >
        {props.children}
      </div>
    )
  }
}
