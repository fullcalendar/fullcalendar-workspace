import { BaseComponent, joinArrayishClassNames } from '@fullcalendar/preact/internal'
import classNames from '@fullcalendar/preact/internal-classnames'
import type { ReactNode } from 'react'

export interface ResourceIndentProps {
  level: number // assumed >=1 ... or else caller should not include in DOM
  indentWidth: number | undefined
  style?: any // TODO
  children?: ReactNode
}

export class ResourceIndent extends BaseComponent<ResourceIndentProps> {
  render() {
    const { props, context } = this

    return (
      <div
        className={joinArrayishClassNames(
          context.options.resourceIndentClass,
          classNames.noShrink,
          classNames.flexCol,
          classNames.alignEnd,
        )}
        style={{
          ...props.style,
          width: props.indentWidth != null
            ? props.indentWidth * props.level
            : 0
        }}
      >
        {props.children}
      </div>
    )
  }
}
