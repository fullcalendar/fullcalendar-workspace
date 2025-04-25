import { BaseComponent, joinArrayishClassNames } from '@fullcalendar/core/internal'
import { ComponentChildren, createElement } from '@fullcalendar/core/preact'

export interface ResourceIndentProps {
  level: number
  indentWidth: number | undefined
  children?: ComponentChildren
}

export class ResourceIndent extends BaseComponent<ResourceIndentProps> {
  render() {
    const { props, context } = this

    return (
      <div
        className={joinArrayishClassNames(
          context.options.resourceIndentClassNames,
          'fc-flex-row fc-justify-end',
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
