import { createElement, VNode } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ToolbarWidget, ButtonContentArg } from '../toolbar-struct.js'
import { joinArrayishClassNames } from '../util/html.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'

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
    let children = this.props.widgetGroups.map((widgetGroup) => this.renderWidgetGroup(widgetGroup))

    return createElement(
      'div', {
        className: 'fc-toolbar-section fc-toolbar-' + this.props.name
      },
      ...children,
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
      let { name, buttonHint } = widget

      if (name === 'title') {
        children.push(
          <div
            role='heading'
            aria-level={options.headingLevel}
            id={props.titleId}
            className='fc-toolbar-title'
          >{props.title}</div>,
        )
      } else {
        let isSelected = name === props.selectedButton
        let isDisabled =
          (!props.isTodayEnabled && name === 'today') ||
          (!props.isPrevEnabled && name === 'prev') ||
          (!props.isNextEnabled && name === 'next')

        let renderProps: ButtonContentArg = {
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
            className={joinArrayishClassNames(
              `fc-${name}-button`,
              generateClassName(options.buttonClassNames, renderProps), // calendar-wide
            )}
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
        className: isOnlyButtons
          ? joinArrayishClassNames(options.buttonGroupClassNames)
          : undefined,
      }, ...children)
    }

    return children[0]
  }
}

function renderButtonContent(arg: ButtonContentArg) {
  return (
    arg.text || (arg.icon ? <span className={arg.icon} aria-hidden /> : '')
  )
}
