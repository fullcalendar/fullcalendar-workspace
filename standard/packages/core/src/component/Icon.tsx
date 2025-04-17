import { createElement } from '../preact.js'
import { ClassNamesGenerator } from '../common/render-hook.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { IconInput, IconArg } from '../toolbar-struct.js'
import { BaseComponent } from '../vdom-util.js'
import { joinArrayishClassNames } from '../util/html.js'

interface IconProps {
  input: IconInput
}

export class Icon extends BaseComponent<IconProps> {
  render() {
    const { options } = this.context
    const iconInput = this.props.input
    const renderProps = { direction: options.direction }

    if (typeof iconInput === 'function') {
      return (
        <ContentContainer<IconArg>
          tag='span'
          style={{ display: 'contents' }}
          attrs={{ 'aria-hidden': true }}
          renderProps={renderProps}
          generatorName={undefined}
          customGenerator={iconInput} />
      )
    }

    return (
      <span
        aria-hidden
        className={joinArrayishClassNames(
          options.iconClassNames,
          generateClassName(
            (iconInput as { classNames: ClassNamesGenerator<IconArg> }).classNames,
            renderProps
          )
        )}
      />
    )
  }
}
