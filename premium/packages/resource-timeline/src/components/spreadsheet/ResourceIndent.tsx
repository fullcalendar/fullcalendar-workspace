import { BaseComponent, joinArrayishClassNames } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { ComponentChildren, createElement } from '@fullcalendar/core/preact'

export interface ResourceIndentProps {
  level: number // assumed >=1 ... or else caller should not include in DOM
  indentWidth: number | undefined
  style?: any // TODO
  children?: ComponentChildren
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
