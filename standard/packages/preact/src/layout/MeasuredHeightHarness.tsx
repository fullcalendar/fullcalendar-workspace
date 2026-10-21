import { type Ref, type ReactNode } from 'react'
import { useReportedSize } from './useReportedSize'
import { Dictionary } from '../util/object'

export interface MeasuredHeightHarnessProps {
  style: any // TODO
  className?: string
  attrs?: Dictionary
  children?: ReactNode
  heightRef?: Ref<number>
}

/*
A wrapper can gain or lose measurement responsibility without remounting, because a row switches
placement routes (screen<->print, for example) while reusing the same keyed nodes. useReportedSize
hands a newly attached heightRef what was already observed, and releases the detached one
*/
export function MeasuredHeightHarness(props: MeasuredHeightHarnessProps) {
  const elRef = useReportedSize({ watchHeight: true, heightRef: props.heightRef })

  return (
    <div
      {...props.attrs}
      className={props.className}
      style={props.style}
      ref={elRef}
    >
      {props.children}
    </div>
  )
}
