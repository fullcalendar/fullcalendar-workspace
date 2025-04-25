import { BaseComponent, Icon, joinArrayishClassNames } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'

export interface ResourceExpanderProps {
  isExpanded: boolean
  onExpanderClick?: any // TODO type
  elRef?: Ref<HTMLElement>
  className?: string
}

export class ResourceExpander extends BaseComponent<ResourceExpanderProps> {
  render() {
    const { props, context } = this
    const { options } = context
    const iconInputs = options.icons || {}

    return (
      <span
        aria-hidden // TODO: better a11y when doing roving tabindex
        className={joinArrayishClassNames(
          options.resourceExpanderClassNames,
          props.className,
        )}
        onClick={props.onExpanderClick}
        ref={props.elRef}
      >
        <Icon input={props.isExpanded ? iconInputs.collapse : iconInputs.expand} />
      </span>
    )
  }
}
