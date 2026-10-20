import { memo, type Ref } from 'react'
import { useReportedSize } from '../hooks/useReportedSize'

export interface RulerProps {
  widthRef: Ref<number>
}

export const Ruler = memo(function Ruler(props: RulerProps) {
  const elRef = useReportedSize({ watchWidth: true, widthRef: props.widthRef })

  return (
    <div ref={elRef} />
  )
})
