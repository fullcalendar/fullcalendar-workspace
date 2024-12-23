import { Dictionary } from '../options.js'
import { computeClippedClientRect } from '../util/dom-geom.js'
import { applyStyle, getEventTargetViaRoot, getUniqueDomId } from '../util/dom-manip.js'
import { createElement, ComponentChildren, Ref, createPortal, createRef } from '../preact.js'
import { BaseComponent, setRef } from '../vdom-util.js'
import { joinClassNames } from '../util/html.js'

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

export class Popover extends BaseComponent<PopoverProps> {
  private rootEl: HTMLElement
  private focusStartRef = createRef<HTMLDivElement>()
  private focusEndRef = createRef<HTMLDivElement>()
  private titleId = getUniqueDomId()

  render(): any {
    let { theme, options } = this.context
    let { props } = this

    return createPortal(
      <div
        {...props.attrs}
        id={props.id}
        aria-labelledby={this.titleId}
        className={joinClassNames(
          props.className,
          'fc-popover',
          theme.getClassName('popover'),
        )}
        ref={this.handleRootEl}
      >
        <div
          tabIndex={0}
          style={{ outline: 'none' }} // TODO: className?
          ref={this.focusStartRef}
        />
        <div className={'fc-popover-header ' + theme.getClassName('popoverHeader')}>
          <span className="fc-popover-title" id={this.titleId}>
            {props.title}
          </span>
          <span
            aria-label={options.closeHint}
            className={'fc-popover-close ' + theme.getIconClass('close')}
            onClick={this.handleClose}
          />
        </div>
        <div className={'fc-popover-body ' + theme.getClassName('popoverContent')}>
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

    const focusStartEl = this.focusStartRef.current
    const focusEndEl = this.focusEndRef.current
    focusStartEl.focus()
    focusStartEl.addEventListener('focus', this.handleClose)
    focusEndEl.addEventListener('focus', this.handleClose)

    this.updateSize()
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentMouseDown)
    document.removeEventListener('keydown', this.handleDocumentKeyDown)

    const focusStartEl = this.focusStartRef.current
    const focusEndEl = this.focusEndRef.current
    focusStartEl.removeEventListener('focus', this.handleClose)
    focusEndEl.removeEventListener('focus', this.handleClose)
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
        ? alignEl.closest(alignParentTop).getBoundingClientRect().top
        : alignmentRect.top

      let popoverLeft = isRtl ? alignmentRect.right - popoverDims.width : alignmentRect.left

      // constrain
      popoverTop = Math.max(popoverTop, PADDING_FROM_VIEWPORT)
      popoverLeft = Math.min(popoverLeft, document.documentElement.clientWidth - PADDING_FROM_VIEWPORT - popoverDims.width)
      popoverLeft = Math.max(popoverLeft, PADDING_FROM_VIEWPORT)

      let origin = rootEl.offsetParent.getBoundingClientRect()
      applyStyle(rootEl, {
        top: popoverTop - origin.top,
        left: popoverLeft - origin.left,
      })
    }
  }
}
