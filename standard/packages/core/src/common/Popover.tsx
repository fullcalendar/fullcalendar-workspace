import { Dictionary } from '../options.js'
import { computeClippedClientRect } from '../util/dom-geom.js'
import { applyStyle, getEventTargetViaRoot, getUniqueDomId } from '../util/dom-manip.js'
import { createElement, ComponentChildren, Ref, createPortal } from '../preact.js'
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
  private titleId = getUniqueDomId()

  render(): any {
    let { theme, options } = this.context
    let { props } = this

    return createPortal(
      <div
        {...props.attrs}
        id={props.id}
        tabindex={-1} // allow programmatic focusing
        aria-labelledby={this.titleId}
        className={joinClassNames(
          props.className,
          'fc-popover',
          theme.getClassName('popover'),
        )}
        ref={this.handleRootEl}
      >
        <div className={'fc-popover-header ' + theme.getClassName('popoverHeader')}>
          <span className="fc-popover-title" id={this.titleId}>
            {props.title}
          </span>
          <span
            aria-label={options.closeHint}
            className={'fc-popover-close ' + theme.getIconClass('close')}
            onClick={this.handleCloseClick}
          />
        </div>
        <div className={'fc-popover-body ' + theme.getClassName('popoverContent')}>
          {props.children}
        </div>
      </div>,
      props.parentEl,
    )
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleDocumentMouseDown)
    document.addEventListener('keydown', this.handleDocumentKeyDown)
    this.rootEl.addEventListener("focusout", this.handleFocusOut)
    this.updateSize()
    this.rootEl.focus()
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentMouseDown)
    document.removeEventListener('keydown', this.handleDocumentKeyDown)
    this.rootEl.removeEventListener("focusout", this.handleFocusOut)
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
      this.handleCloseClick()
    }
  }

  handleDocumentKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.handleCloseClick()
    }
  }

  handleFocusOut = (ev: FocusEvent) => {
    // even though this event fires when focus LEAVES, this value holds where it ended up
    const relatedTarget = ev.relatedTarget as HTMLElement | null

    // focuses away into something that's not within the popover?
    if (!relatedTarget || !this.rootEl.contains(relatedTarget)) {
      this.handleCloseClick() // HACK
    }
  }

  handleCloseClick = () => {
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
