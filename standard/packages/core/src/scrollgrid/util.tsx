import { ScrollerSyncerClass } from "./ScrollerSyncerInterface.js"

export type CssDimValue = string | number // TODO: move to more general file

export function getIsHeightAuto(options: {
  height?: CssDimValue,
  contentHeight?: CssDimValue
}): boolean {
  return options.height === 'auto' || options.contentHeight === 'auto'
}

export function getStickyHeaderDates(options: {
  height?: CssDimValue,
  contentHeight?: CssDimValue,
  stickyHeaderDates?: boolean | 'auto'
}): boolean {
  let { stickyHeaderDates } = options

  if (stickyHeaderDates == null || stickyHeaderDates === 'auto') {
    stickyHeaderDates = getIsHeightAuto(options)
  }

  return stickyHeaderDates
}

export function getStickyFooterScrollbar(options: {
  height?: CssDimValue,
  contentHeight?: CssDimValue,
  stickyFooterScrollbar?: boolean | 'auto'
}): boolean {
  let { stickyFooterScrollbar } = options

  if (stickyFooterScrollbar == null || stickyFooterScrollbar === 'auto') {
    stickyFooterScrollbar = getIsHeightAuto(options)
  }

  return stickyFooterScrollbar
}

export function getScrollerSyncerClass(pluginHooks: {
  scrollerSyncerClass: ScrollerSyncerClass | null,
}): ScrollerSyncerClass {
  const ScrollerSyncer = pluginHooks.scrollerSyncerClass

  if (!ScrollerSyncer) {
    throw new RangeError('Must import @fullcalendar/scrollgrid')
  }

  return ScrollerSyncer
}
