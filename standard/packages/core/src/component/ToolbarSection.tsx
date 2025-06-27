import { ComponentChild, createElement, Fragment, VNode } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ToolbarWidget, ButtonData } from '../toolbar-struct.js'
import { joinArrayishClassNames, joinClassNames } from '../util/html.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { ButtonIcon } from './ButtonIcon.js'
import classNames from '../internal-classnames.js'

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
          generateClassName(options.toolbarSectionClass, { name: props.name }),
          classNames.flexRow,
          classNames.noShrink,
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
            className={joinArrayishClassNames(options.toolbarTitleClass)}
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

        let buttonDisplay = widget.buttonDisplay ?? options.buttonDisplay
        if (buttonDisplay === 'auto') {
          buttonDisplay = (widget.buttonIconContent || widget.buttonIconClass)
            ? 'icon'
            : 'text'
        }

        let iconNode: ComponentChild
        if (buttonDisplay !== 'text') {
          iconNode = (
            <ButtonIcon
              classNameGenerator={widget.buttonIconClass}
              contentGenerator={widget.buttonIconContent}
            />
          )
        }

        let inGroup = widgetGroup.length > 1 && isOnlyButtons
        let inViewGroup = inGroup && isOnlyView
        let renderProps: ButtonData = {
          name,
          text: widget.buttonText,
          isSelected,
          isDisabled,
          isIconOnly: buttonDisplay === 'icon',
          inGroup,
          inViewGroup,
        }

        children.push(
          <ContentContainer<ButtonData>
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
            className={joinClassNames(
              generateClassName(options.buttonClass, renderProps),
              !isDisabled && classNames.cursorPointer,
            )}
            renderProps={renderProps}
            generatorName={undefined}
            classNameGenerator={widget.buttonClass}
            didMount={widget.buttonDidMount}
            willUnmount={widget.buttonWillUnmount}
          >{() => (
            buttonDisplay === 'text'
              ? widget.buttonText
              : buttonDisplay === 'icon'
                ? iconNode
                : buttonDisplay === 'icon-text'
                  ? (<Fragment>{iconNode}{widget.buttonText}</Fragment>)
                  : (<Fragment>{widget.buttonText}{iconNode}</Fragment>) // text-icon
          )}</ContentContainer>
        )
      }
    }

    if (children.length > 1) {
      return createElement('div', {
        role: (isOnlyButtons && isOnlyView) ? 'tablist' : undefined,
        'aria-label': (isOnlyButtons && isOnlyView) ? options.viewChangeHint : undefined,
        className: joinArrayishClassNames(
          classNames.flexRow,
          generateClassName(options.buttonGroupClass, { isViewGroup: isOnlyView })
        ),
      }, ...children)
    }

    return children[0]
  }
}
