import { BaseComponent, ContentContainer, generateClassName, joinClassNames } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { ResourceExpanderArg } from '../../structs.js'

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

    const renderProps: ResourceExpanderArg = {
      isExpanded: props.isExpanded,
      direction: options.direction,
    }

    return (
      <span
        aria-hidden // TODO: better a11y when doing roving tabindex
        className={joinClassNames(
          generateClassName(classNameGenerator, renderProps),
          props.className,
        )}
        onClick={props.onExpanderClick}
        ref={props.elRef}
      >
        {contentGenerator && (
          <ContentContainer<ResourceExpanderArg>
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
