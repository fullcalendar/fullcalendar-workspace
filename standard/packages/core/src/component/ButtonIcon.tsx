import { createElement } from '../preact.js'
import { CustomContentGenerator } from '../common/render-hook.js'
import { ContentContainer } from '../content-inject/ContentContainer.js'
import { BaseComponent } from '../vdom-util.js'

interface IconProps {
  className?: string
  contentGenerator?: CustomContentGenerator<{}>
}

export class ButtonIcon extends BaseComponent<IconProps> {
  render() {
    const { contentGenerator, className } = this.props

    if (contentGenerator) {
      // TODO: somehow give className to the svg?
      return (
        <ContentContainer<{}>
          tag='span'
          style={{ display: 'contents' }}
          attrs={{ 'aria-hidden': true }}
          renderProps={{}}
          generatorName={undefined}
          customGenerator={contentGenerator}
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
  }
}
