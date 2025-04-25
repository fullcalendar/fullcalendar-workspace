import { createElement, VNode } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ToolbarWidget, ButtonContentArg } from '../toolbar-struct.js'
import { joinArrayishClassNames, joinClassNames } from '../util/html.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { Icon } from './Icon.js'

export interface ToolbarContent {
  title: string
  navUnit: string
  selectedButton: string
  isTodayEnabled: boolean
  isPrevEnabled: boolean
  isNextEnabled: boolean
}

export interface ToolbarSectionProps extends ToolbarContent {
  name: string
  widgetGroups: ToolbarWidget[][]
  titleId?: string
}

export class ToolbarSection extends BaseComponent<ToolbarSectionProps> {
  render(): any {
    let { props } = this
    let { options } = this.context
    let children = props.widgetGroups.map((widgetGroup) => this.renderWidgetGroup(widgetGroup))

    return createElement(
      'div', {
        className: joinClassNames(
          generateClassName(options.toolbarSectionClassNames, { name: props.name }),
          'fcu-flex-row fcu-no-shrink fcu-align-center',
        ),
      },
      ...children, // spread, so no React key errors
    )
  }

  renderWidgetGroup(widgetGroup: ToolbarWidget[]): any {
    let { props, context } = this
    let { options } = context
    let children: VNode[] = []

    let isOnlyButtons = true
    let isOnlyView = true

    for (const widget of widgetGroup) {
      const { name, isView } = widget

      if (name === 'title') {
        isOnlyButtons = false
      } else if (!isView) {
        isOnlyView = false
      }
    }

    for (let widget of widgetGroup) {
      let { name, customElement, buttonHint } = widget

      if (name === 'title') {
        children.push(
          <div
            role='heading'
            aria-level={options.headingLevel}
            id={props.titleId}
            className={joinArrayishClassNames(options.toolbarTitleClassNames)}
          >{props.title}</div>,
        )
      } else if (customElement) {
        children.push(
          <ContentContainer
            tag='span'
            style={{ display: 'contents' }}
            renderProps={{}}
            generatorName={undefined}
            customGenerator={customElement}
          />
        )
      } else {
        let isSelected = name === props.selectedButton
        let isDisabled =
          (!props.isTodayEnabled && name === 'today') ||
          (!props.isPrevEnabled && name === 'prev') ||
          (!props.isNextEnabled && name === 'next')

        let renderProps: ButtonContentArg = {
          name,
          icon: widget.buttonIcon,
          text: widget.buttonText,
          isSelected,
          isDisabled,
        }

        children.push(
          <ContentContainer<ButtonContentArg>
            tag='button'
            attrs={{
              type: 'button',
              disabled: isDisabled,
              ...(
                (isOnlyButtons && isOnlyView)
                  ? { 'role': 'tab', 'aria-selected': isSelected }
                  : { 'aria-pressed': isSelected }
              ),
              'aria-label': typeof buttonHint === 'function'
                ? buttonHint(props.navUnit)
                : buttonHint,
              onClick: widget.buttonClick,
            }}
            className={generateClassName(options.buttonClassNames, renderProps)}
            renderProps={renderProps}
            generatorName='buttonContent'
            customGenerator={widget.buttonContent || options.buttonContent}
            defaultGenerator={renderButtonContent}
            classNameGenerator={widget.buttonClassNames}
            didMount={widget.buttonDidMount}
            willUnmount={widget.buttonWillUnmount}
          />
        )
      }
    }

    if (children.length > 1) {
      return createElement('div', {
        role: (isOnlyButtons && isOnlyView) ? 'tablist' : undefined,
        'aria-label': (isOnlyButtons && isOnlyView) ? options.viewChangeHint : undefined,
        className: joinArrayishClassNames(
          'fcu-flex-row',
          isOnlyButtons
            ? options.buttonGroupClassNames
            : 'fcu-align-center',
        ),
      }, ...children)
    }

    return children[0]
  }
}

function renderButtonContent(arg: ButtonContentArg) {
  return (
    <ToolbarButton icon={arg.icon} text={arg.text} />
  )
}

// ToolbarButton
// -------------------------------------------------------------------------------------------------

interface ToolbarButtonProps {
  icon: string | false
  text: string
}

class ToolbarButton extends BaseComponent<ToolbarButtonProps> {
  render() {
    const { options } = this.context
    const { icon, text } = this.props
    const iconInputs = options.icons || {}
    const iconInput = icon && iconInputs[icon]

    if (iconInput) {
      return (
        <Icon input={iconInput} />
      )
    }

    return text
  }
}
