import { TimelineDateProfile } from './timeline-date-profile.js'

export interface CoordRange {
  start: number
  size: number
}

export function createVerticalStyle(
  props: { start: number; size: number; } | undefined,
): { top: number, height: number } | undefined {
  if (props) {
    return {
      top: props.start,
      height: props.size,
    };
  }
}

export function createHorizontalStyle(
  props: { start: number; size: number; } | undefined,
  isRtl: boolean
): { left: number, width: number } | { right: number, width: number } | undefined {
  if (props) {
    return {
      [isRtl ? 'right' : 'left']: props.start,
      width: props.size,
    } as any
  }
}

// Timeline-specific
// -------------------------------------------------------------------------------------------------

export function computeSlotWidth(
  tDateProfile: TimelineDateProfile,
  slotMinWidth: number | undefined,
  slotCushionMaxWidth: number | number, // TODO: if either is undefined, return undefined
  timeViewportWidth: number | number
): [
  slotWidth: number, // FYI: don't apply to last cell. will have a remainder
  totalWidth: number
] {
  // const slatMinWidth = Math.max(30, ((slatMaxWidth || 0) / tDateProfile.slotsPerLabel))
  // TODO: ensure returns integers, so can be multiplied
  return null as any;
}
