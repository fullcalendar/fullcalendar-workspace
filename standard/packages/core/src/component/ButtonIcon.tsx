import { createElement } from '../preact.js'
import { CustomContentGenerator } from '../common/render-hook.js'
import { ContentContainer } from '../content-inject/ContentContainer.js'
import { BaseComponent } from '../vdom-util.js'
import { ClassNameInput, joinArrayishClassNames } from '../util/html.js'

interface IconProps {
  contentGenerator?: CustomContentGenerator<{}>
  classNameInput?: ClassNameInput
}

export class ButtonIcon extends BaseComponent<IconProps> {
  render() {
    const { contentGenerator, classNameInput } = this.props

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

    if (classNameInput) {
      return (
        <span
          aria-hidden
          className={joinArrayishClassNames(classNameInput)}
        />
      )
    }
  }
}
