import { CalendarOptions } from '../options/options'

/*
Whether the view is borderless on each side: the per-side options, falling back to `borderless`
*/

export function computeViewBorderless(options: CalendarOptions) {
  const borderless = options.borderless
  return {
    borderlessX: Boolean(options.borderlessX ?? borderless),
    borderlessTop: Boolean(options.borderlessTop ?? borderless),
    borderlessBottom: Boolean(options.borderlessBottom ?? borderless),
  }
}
