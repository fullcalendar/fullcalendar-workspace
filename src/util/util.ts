
/*
Given a jQuery <tr> set, returns the <td>'s that do not have multi-line rowspans.
Would use the [rowspan] selector, but never not defined in IE8.
*/
export function getOwnCells(trs) {
  return trs.find('> td').filter((i, tdNode) => (tdNode.rowSpan <= 1))
}
