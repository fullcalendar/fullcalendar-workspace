import { CssDimValue } from './util'
import { memo, type Ref } from 'react'
import { Scroller } from './Scroller'
import { useReportedSize } from '../layout/useReportedSize'
import { joinClassNames } from '../util/html'
import classNames from '../styles.module.css'

export interface FooterScrollbarProps {
  isSticky?: boolean
  canvasWidth: CssDimValue
  scrollerRef?: Ref<Scroller>
  scrollbarWidthRef?: Ref<number>
}

export const FooterScrollbar = memo(function FooterScrollbar(props: FooterScrollbarProps) {
  // the scrollbar's thickness is the wrapper's height
  const elRef = useReportedSize({ watchHeight: true, heightRef: props.scrollbarWidthRef })

  // NOTE: we need a wrapper around the Scroller because if scrollbars appear/hide,
  // the outer dimensions change, but the inner dimensions do not. The Scroller's
  // dimension-watching, when used in ponyfill-mode, can't fire on border-box change, so we
  // workaround it by monitoring dimensions of a wrapper instead
  return (
    <div
      ref={elRef}
      className={joinClassNames(
        classNames.footerScrollbar,
        props.isSticky && classNames.footerScrollbarSticky,
      )}
    >
      <Scroller horizontal ref={props.scrollerRef}>
        <div style={{ minWidth: props.canvasWidth }} />
      </Scroller>
    </div>
  )
})
