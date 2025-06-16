import { BaseComponent, joinArrayishClassNames } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { ComponentChildren, createElement } from '@fullcalendar/core/preact'

export interface ResourceIndentProps {
  level: number
  indentWidth: number | undefined
  children?: ComponentChildren
}

export class ResourceIndent extends BaseComponent<ResourceIndentProps> {
  render() {
    const { props } = this

    return (
      <div
        className={joinArrayishClassNames(
          classNames.noShrink,
          classNames.flexRow,
          classNames.justifyEnd,
        )}
        style={{
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
