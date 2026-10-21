import { joinClassNames } from '@fullcalendar/preact/public-api'
import { useViewOptions } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, type ReactNode } from 'react'

export interface ResourceIndentProps {
  level: number // assumed >=1 ... or else caller should not include in DOM
  indentWidth: number | undefined
  className?: string
  style?: any // TODO
  children?: ReactNode
}

export const ResourceIndent = memo(function ResourceIndent(props: ResourceIndentProps) {
  const options = useViewOptions()

  return (
    <div
      className={joinClassNames(
        options.resourceIndentClass,
        classNames.noShrink,
        classNames.flexCol,
        classNames.alignEnd,
        props.className,
      )}
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
})
