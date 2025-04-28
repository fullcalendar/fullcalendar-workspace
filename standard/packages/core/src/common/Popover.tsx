import { Dictionary } from '../options.js'
import { computeClippedClientRect } from '../util/dom-geom.js'
import { applyStyle, getEventTargetViaRoot, getUniqueDomId } from '../util/dom-manip.js'
import { createElement, ComponentChildren, Ref, createPortal, createRef } from '../preact.js'
import { BaseComponent, setRef } from '../vdom-util.js'
import { joinArrayishClassNames } from '../util/html.js'
import { createAriaClickAttrs } from '../util/dom-event.js'
import { Icon } from '../component/Icon.js'

export interface PopoverProps {
  elRef?: Ref<HTMLElement>
  id: string
  title: string
  attrs?: Dictionary
  className?: string
  parentEl: HTMLElement
  alignEl: HTMLElement
  alignParentTop?: string // a CSS selector
  children?: ComponentChildren
  onClose?: () => void
}

const PADDING_FROM_VIEWPORT = 10

const ROW_BORDER_WIDTH = 1

export class Popover extends BaseComponent<PopoverProps> {
  private rootEl: HTMLElement
  private closeRef = createRef<HTMLDivElement>()
  private focusStartRef = createRef<HTMLDivElement>()
  private focusEndRef = createRef<HTMLDivElement>()
  private titleId = getUniqueDomId()

  render(): any {
    let { options } = this.context
    let { props } = this
    let closeIconInput = options.icons?.close

    return createPortal(
      <div
        {...props.attrs}
        id={props.id}
        role='dialog'
        aria-labelledby={this.titleId}
        className={joinArrayishClassNames(
          'fci-popover fcu-popover-z fcu-abs',
          options.popoverClassNames,
          props.className,
        )}
        ref={this.handleRootEl}
      >
        <div
          tabIndex={0}
          style={{ outline: 'none' }} // TODO: className?
          ref={this.focusStartRef}
        />
        <div className={joinArrayishClassNames(options.popoverHeaderClassNames)}>
          <div
            id={this.titleId}
            className={joinArrayishClassNames(options.popoverTitleClassNames)}
          >
            {props.title}
          </div>
          <div
            role='button'
            aria-label={options.closeHint}
            className={joinArrayishClassNames(options.popoverCloseClassNames)}
            {...createAriaClickAttrs(this.handleClose)}
            ref={this.closeRef}
          >
            <Icon input={closeIconInput} />
          </div>
        </div>
        <div className={joinArrayishClassNames(options.popoverBodyClassNames)}>
          {props.children}
        </div>
        <div
          tabIndex={0}
          style={{ outline: 'none' }} // TODO: className?
          ref={this.focusEndRef}
        />
      </div>,
      props.parentEl,
    )
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleDocumentMouseDown)
    document.addEventListener('keydown', this.handleDocumentKeyDown)

    this.focusStartRef.current.addEventListener('focus', this.handleClose)
    this.focusEndRef.current.addEventListener('focus', this.handleClose)
    this.closeRef.current.focus({ preventScroll: true })

    this.updateSize()
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentMouseDown)
    document.removeEventListener('keydown', this.handleDocumentKeyDown)

    this.focusStartRef.current.removeEventListener('focus', this.handleClose)
    this.focusEndRef.current.removeEventListener('focus', this.handleClose)
  }

  handleRootEl = (el: HTMLElement | null) => {
    this.rootEl = el

    if (this.props.elRef) {
      setRef(this.props.elRef, el)
    }
  }

  // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
  handleDocumentMouseDown = (ev) => {
    // only hide the popover if the click happened outside the popover
    const target = getEventTargetViaRoot(ev) as HTMLElement
    if (!this.rootEl.contains(target)) {
      this.handleClose()
    }
  }

  handleDocumentKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.handleClose()
    }
  }

  // for many different close techniques
  // cannot accept params because might receive a browser Event
  handleClose = () => {
    let { onClose } = this.props
    if (onClose) {
      onClose()
    }
  }

  private updateSize() {
    let { isRtl } = this.context
    let { alignEl, alignParentTop } = this.props
    let { rootEl } = this

    let alignmentRect = computeClippedClientRect(alignEl)
    if (alignmentRect) {
      let popoverDims = rootEl.getBoundingClientRect()

      // position relative to viewport
      let popoverTop = alignParentTop
        // HACK: subtract 1 for DayGrid, which has borders on row-bottom. Only view that uses alignParentTop
        ? alignEl.closest(alignParentTop).getBoundingClientRect().top - ROW_BORDER_WIDTH
        : alignmentRect.top

      let popoverLeft = isRtl ? alignmentRect.right - popoverDims.width : alignmentRect.left

      // constrain
      popoverTop = Math.max(popoverTop, PADDING_FROM_VIEWPORT)
      popoverLeft = Math.min(popoverLeft, document.documentElement.clientWidth - PADDING_FROM_VIEWPORT - popoverDims.width)
      popoverLeft = Math.max(popoverLeft, PADDING_FROM_VIEWPORT)

      // HACK
      // could use .offsetParent, however, the bounding rect includes border, so off-by-one
      let origin = alignEl.closest('.fci-view').getBoundingClientRect()

      applyStyle(rootEl, {
        top: popoverTop - origin.top,
        left: popoverLeft - origin.left,
      })
    }
  }
}
