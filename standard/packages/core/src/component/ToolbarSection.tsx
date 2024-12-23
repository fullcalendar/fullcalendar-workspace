import { createElement, VNode } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ToolbarWidget } from '../toolbar-struct.js'
import { joinClassNames } from '../util/html.js'

export interface ToolbarContent {
  title: string
  navUnit: string
  activeButton: string
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
    let { options, theme } = context
    let children: VNode[] = []

    let isOnlyButtons = true
    let isOnlyView = true

    for (const widget of widgetGroup) {
      const { buttonName, isView } = widget

      if (buttonName === 'title') {
        isOnlyButtons = false
      } else if (!isView) {
        isOnlyView = false
      }
    }

    for (let widget of widgetGroup) {
      let { buttonName, buttonClick, buttonText, buttonIcon, buttonHint } = widget

      if (buttonName === 'title') {
        children.push(
          <h2 className="fc-toolbar-title" id={props.titleId}>{props.title}</h2>,
        )
      } else {
        let isPressed = buttonName === props.activeButton
        let isDisabled =
          (!props.isTodayEnabled && buttonName === 'today') ||
          (!props.isPrevEnabled && buttonName === 'prev') ||
          (!props.isNextEnabled && buttonName === 'next')

        children.push(
          <button
            type="button"
            disabled={isDisabled}
            {...(
              (isOnlyButtons && isOnlyView)
                ? { 'role': 'tab', 'aria-selected': isPressed }
                : { 'aria-pressed': isPressed }
            )}
            aria-label={typeof buttonHint === 'function' ? buttonHint(props.navUnit) : buttonHint}
            className={joinClassNames(
              `fc-${buttonName}-button`,
              theme.getClassName('button'),
              isPressed && theme.getClassName('buttonActive'),
            )}
            onClick={buttonClick}
          >
            {buttonText || (buttonIcon ? <span className={buttonIcon} role="img" /> : '')}
          </button>,
        )
      }
    }

    if (children.length > 1) {
      return createElement('div', {
        role: (isOnlyButtons && isOnlyView) ? 'tablist' : undefined,
        'aria-label': (isOnlyButtons && isOnlyView) ? options.viewChangeHint : undefined,
        className: isOnlyButtons ? theme.getClassName('buttonGroup') : undefined,
      }, ...children)
    }

    return children[0]
  }
}
