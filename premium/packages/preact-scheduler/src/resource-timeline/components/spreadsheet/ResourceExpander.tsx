import { joinClassNames } from '@fullcalendar/preact/public-api'
import { CustomContent, generateClassName, useViewContext } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, type Ref } from 'react'
import { ResourceExpanderInfo } from '../../structs'

export interface ResourceExpanderProps {
  isExpanded: boolean
  onExpanderClick?: any // TODO type
  elRef?: Ref<HTMLElement>
  className?: string
}

const CONTENT_STYLE = { display: 'contents' }
const CONTENT_ATTRS = { 'aria-hidden': true }

export const ResourceExpander = memo(function ResourceExpander(props: ResourceExpanderProps) {
  const { options } = useViewContext()
  const classNameGenerator = options.resourceExpanderClass
  const contentGenerator = options.resourceExpanderContent

  const renderProps: ResourceExpanderInfo = {
    isExpanded: props.isExpanded,
  }

  return (
    <span
      aria-hidden // TODO: better a11y when doing roving tabindex
      className={joinClassNames(
        generateClassName(classNameGenerator, renderProps),
        classNames.flexRow,
        classNames.cursorPointer,
        classNames.selectNone, // prevent text-selecting cell underneath
        classNames.noMargin,
        props.className,
      )}
      onClick={props.onExpanderClick}
      ref={props.elRef}
    >
      {contentGenerator && (
        <CustomContent<ResourceExpanderInfo>
          tag='span'
          style={CONTENT_STYLE}
          attrs={CONTENT_ATTRS}
          renderProps={renderProps}
          generatorName={undefined}
          generator={contentGenerator}
        />
      )}
    </span>
  )
})
