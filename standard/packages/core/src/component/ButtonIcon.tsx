import { createElement } from '../preact.js'
import { ClassNamesGenerator, CustomContentGenerator } from '../common/render-hook.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { ButtonIconArg } from '../toolbar-struct.js'
import { BaseComponent } from '../vdom-util.js'

interface IconProps {
  contentGenerator?: CustomContentGenerator<ButtonIconArg>
  classNameGenerator?: ClassNamesGenerator<ButtonIconArg>
}

export class ButtonIcon extends BaseComponent<IconProps> {
  render() {
    const { contentGenerator, classNameGenerator } = this.props
    const { options } = this.context
    const renderProps: ButtonIconArg = {
      direction: options.direction,
    }

    if (contentGenerator) {
      // TODO: somehow give className to the svg?
      return (
        <ContentContainer<ButtonIconArg>
          tag='span'
          style={{ display: 'contents' }}
          attrs={{ 'aria-hidden': true }}
          renderProps={renderProps}
          generatorName={undefined}
          customGenerator={contentGenerator}
        />
      )
    }

    if (classNameGenerator) {
      return (
        <span
          aria-hidden
          className={generateClassName(classNameGenerator, renderProps)}
        />
      )
    }
  }
}
