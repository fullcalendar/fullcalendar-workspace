
export type CssDimValue = string | number // TODO: move to more general file

export function getIsHeightAuto(options: {
  height?: CssDimValue,
  viewHeight?: CssDimValue
}): boolean {
  return options.height === 'auto' || options.viewHeight === 'auto'
}

export function getStickyHeaderDates(options: {
  height?: CssDimValue,
  viewHeight?: CssDimValue,
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
  viewHeight?: CssDimValue,
  stickyFooterScrollbar?: boolean | 'auto'
}): boolean {
  let { stickyFooterScrollbar } = options

  if (stickyFooterScrollbar == null || stickyFooterScrollbar === 'auto') {
    stickyFooterScrollbar = getIsHeightAuto(options)
  }

  return stickyFooterScrollbar
}
