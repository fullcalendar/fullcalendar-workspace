import { memo } from 'react'
import { ContentGenerator } from '../common/render-hook'
import { CustomContent } from '../content-inject/CustomContent'

interface IconProps {
  className?: string
  contentGenerator?: ContentGenerator<{}>
}

const ICON_STYLE = { display: 'contents' }
const ICON_ATTRS = { 'aria-hidden': true }
const ICON_RENDER_PROPS = {}

export const ButtonIcon = memo(function ButtonIcon({ contentGenerator, className }: IconProps) {
  if (contentGenerator) {
    // TODO: somehow give className to the svg?
    return (
      <CustomContent<{}>
        tag='span'
        style={ICON_STYLE}
        attrs={ICON_ATTRS}
        renderProps={ICON_RENDER_PROPS}
        generatorName={undefined}
        generator={contentGenerator}
      />
    )
  }

  if (className !== undefined) {
    return (
      <span
        aria-hidden
        className={className}
      />
    )
  }

  return null
})
