import { BaseComponent, ContentContainer, generateClassName, joinClassNames } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { ResourceExpanderData } from '../../structs.js'

export interface ResourceExpanderProps {
  isExpanded: boolean
  onExpanderClick?: any // TODO type
  elRef?: Ref<HTMLElement>
  className?: string
}

export class ResourceExpander extends BaseComponent<ResourceExpanderProps> {
  render() {
    const { props } = this
    const { options } = this.context
    const classNameGenerator = options.resourceExpanderClassNames
    const contentGenerator = options.resourceExpanderContent

    const renderProps: ResourceExpanderData = {
      isExpanded: props.isExpanded,
      direction: options.direction,
    }

    return (
      <span
        aria-hidden // TODO: better a11y when doing roving tabindex
        className={joinClassNames(
          generateClassName(classNameGenerator, renderProps),
          classNames.cursorPointer,
          props.className,
        )}
        onClick={props.onExpanderClick}
        ref={props.elRef}
      >
        {contentGenerator && (
          <ContentContainer<ResourceExpanderData>
            tag='span'
            style={{ display: 'contents' }}
            attrs={{ 'aria-hidden': true }}
            renderProps={renderProps}
            generatorName={undefined}
            customGenerator={contentGenerator}
          />
        )}
      </span>
    )
  }
}
