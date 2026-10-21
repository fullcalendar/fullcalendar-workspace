import { memo, type Ref } from 'react'
import { useReportedSize } from '../layout/useReportedSize'

export interface RulerProps {
  widthRef: Ref<number>
}

export const Ruler = memo(function Ruler(props: RulerProps) {
  const elRef = useReportedSize({ watchWidth: true, widthRef: props.widthRef })

  return (
    <div ref={elRef} />
  )
})
