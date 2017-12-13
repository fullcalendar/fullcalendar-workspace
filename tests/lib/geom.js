
// Bounding Rect Utils
// --------------------------------------------------------------------------------------------------


// fix bug with jQuery 3 returning 0 height for <td> elements in the IE's
[ 'height', 'outerHeight' ].forEach(function(methodName) {
  const orig = $.fn[methodName]

  $.fn[methodName] = function() {
    if (!arguments.length && this.is('td')) {
      return this[0].getBoundingClientRect().height
    } else {
      return orig.apply(this, arguments)
    }
  }
})


export function getBoundingRect(el) {
  el = $(el)
  return $.extend({}, el[0].getBoundingClientRect(), {
    node: el // very useful for debugging
  })
}


// function getJointBoundingRect(els) {
//   els = $(els)
//   expect(els.length).toBeGreaterThan(0)
//   const rects = Array.from(els).map(function(el) {
//     return getBoundingRect(el)
//   })
//   return joinRects.apply(null, rects)
// }


export function joinRects(rect1, rect2) {
  return {
    left: Math.min(rect1.left, rect2.left),
    right: Math.max(rect1.right, rect2.right),
    top: Math.min(rect1.top, rect2.top),
    bottom: Math.max(rect1.bottom, rect2.bottom)
  }
}


export function getLeadingBoundingRect(els, isRTL) {
  els = $(els)
  expect(els.length).toBeGreaterThan(0)
  let best = null
  els.each(function(i, node) {
    const rect = getBoundingRect(node)
    if (!best) {
      best = rect
    } else if (isRTL) {
      if (rect.right > best.right) {
        best = rect
      }
    } else {
      if (rect.left < best.left) {
        best = rect
      }
    }
  })
  return best
}


export function getTrailingBoundingRect(els, isRTL) {
  els = $(els)
  expect(els.length).toBeGreaterThan(0)
  let best = null
  els.each(function(i, node) {
    const rect = getBoundingRect(node)
    if (!best) {
      best = rect
    } else if (isRTL) {
      if (rect.left < best.left) {
        best = rect
      }
    } else {
      if (rect.right > best.right) {
        best = rect
      }
    }
  })
  return best
}


function getBoundingRects(els) {
  return els.map(function(i, node) {
    return getBoundingRect(node)
  })
}


export function sortBoundingRects(els, isRTL) {
  const rects = els.map(function(i, node) {
    return getBoundingRect(node)
  })
  rects.sort(function(a, b) {
    if (isRTL) {
      return b.right - a.right
    } else {
      return a.left - b.left
    }
  })
  return rects
}


// given an element, returns its bounding box. given a rect, returns the rect.
function massageRect(input) {
  if (isRect(input)) {
    return input
  } else {
    return getBoundingRect(input)
  }
}


function isRect(input) {
  return 'left' in input && 'right' in input && 'top' in input && 'bottom' in input
}


// FC-specific Geometry Utils
// --------------------------------------------------------------------------------------------------


export function doElsMatchSegs(els, segs, segToRectFunc) {
  const unmatchedRects = getBoundingRects(els)

  if (unmatchedRects.length !== segs.length) {
    return false
  }

  for (let seg of segs) {
    const segRect = segToRectFunc(seg)

    // find an element with rectangle that matches
    let found = false
    for (let i = 0; i < unmatchedRects.length; i++) {
      const elRect = unmatchedRects[i]
      if (isRectsSimilar(elRect, segRect)) {
        unmatchedRects.splice(i, 1) // remove
        found = true
        break
      }
    }

    if (!found) {
      return false
    }
  }

  return true // every seg was found
}


// Geometry Utils
// --------------------------------------------------------------------------------------------------


export function joinRect(rect, ...otherRects) {
  for (let otherRect of otherRects) {
    rect = {
      left: Math.min(rect.left, otherRect.left),
      right: Math.max(rect.right, otherRect.right),
      top: Math.min(rect.top, otherRect.top),
      bottom: Math.max(rect.bottom, otherRect.bottom)
    }
  }
  return rect
}


// function intersectRects(rect, ...otherRects) {
//   for (let otherRect of Array.from(otherRects)) {
//     rect = {
//       left: Math.max(rect.left, otherRect.left),
//       right: Math.min(rect.right, otherRect.right),
//       top: Math.max(rect.top, otherRect.top),
//       bottom: Math.min(rect.bottom, otherRect.bottom)
//     }
//     if ((rect.right < rect.left) || (rect.bottom < rect.top)) {
//       return false
//     }
//   }
//   return rect
// }


export function getRectCenter(rect) {
  return {
    left: (rect.left + rect.right) / 2,
    top: (rect.top + rect.bottom) / 2
  }
}


function isRectMostlyAbove(subjectRect, otherRect) {
  return (subjectRect.bottom - otherRect.top) < // overlap is less than
    ((subjectRect.bottom - subjectRect.top) / 2) // half the height
}


function isRectMostlyLeft(subjectRect, otherRect) {
  return (subjectRect.right - otherRect.left) < // overlap is less then
    ((subjectRect.right - subjectRect.left) / 2) // half the width
}


function isRectMostlyBounded(subjectRect, boundRect) {
  return isRectMostlyHBounded(subjectRect, boundRect) &&
    isRectMostlyVBounded(subjectRect, boundRect)
}


function isRectMostlyHBounded(subjectRect, boundRect) {
  return (Math.min(subjectRect.right, boundRect.right) -
    Math.max(subjectRect.left, boundRect.left)) > // overlap area is greater than
      ((subjectRect.right - subjectRect.left) / 2) // half the width
}


function isRectMostlyVBounded(subjectRect, boundRect) {
  return (Math.min(subjectRect.bottom, boundRect.bottom) -
    Math.max(subjectRect.top, boundRect.top)) > // overlap area is greater than
      ((subjectRect.bottom - subjectRect.top) / 2) // half the height
}


function isRectsSimilar(rect1, rect2) {
  return isRectsHSimilar(rect1, rect2) && isRectsVSimilar(rect1, rect2)
}


function isRectsHSimilar(rect1, rect2) {
  // 1, because of possible borders
  return (Math.abs(rect1.left - rect2.left) <= 2) && (Math.abs(rect1.right - rect2.right) <= 2)
}


function isRectsVSimilar(rect1, rect2) {
  // 1, because of possible borders
  return (Math.abs(rect1.top - rect2.top) <= 2) && (Math.abs(rect1.bottom - rect2.bottom) <= 2)
}


// Jasmine Adapters
// --------------------------------------------------------------------------------------------------

beforeEach(function() {
  jasmine.addMatchers({

    toBeMostlyAbove() {
      return {
        compare(subject, other) {
          const result = { pass: isRectMostlyAbove(massageRect(subject), massageRect(other)) }
          if (!result.pass) {
            result.message = 'first rect is not mostly above the second'
          }
          return result
        }
      }
    },

    toBeMostlyBelow() {
      return {
        compare(subject, other) {
          const result = { pass: !isRectMostlyAbove(massageRect(subject), massageRect(other)) }
          if (!result.pass) {
            result.message = 'first rect is not mostly below the second'
          }
          return result
        }
      }
    },

    toBeMostlyLeftOf() {
      return {
        compare(subject, other) {
          const result = { pass: isRectMostlyLeft(massageRect(subject), massageRect(other)) }
          if (!result.pass) {
            result.message = 'first rect is not mostly left of the second'
          }
          return result
        }
      }
    },

    toBeMostlyRightOf() {
      return {
        compare(subject, other) {
          const result = { pass: !isRectMostlyLeft(massageRect(subject), massageRect(other)) }
          if (!result.pass) {
            result.message = 'first rect is not mostly right of the second'
          }
          return result
        }
      }
    },

    toBeMostlyBoundedBy() {
      return {
        compare(subject, other) {
          const result = { pass: isRectMostlyBounded(massageRect(subject), massageRect(other)) }
          if (!result.pass) {
            result.message = 'first rect is not mostly bounded by the second'
          }
          return result
        }
      }
    },

    toBeMostlyHBoundedBy() {
      return {
        compare(subject, other) {
          const result = { pass: isRectMostlyHBounded(massageRect(subject), massageRect(other)) }
          if (!result.pass) {
            result.message = 'first rect does not mostly horizontally bound the second'
          }
          return result
        }
      }
    },

    toBeMostlyVBoundedBy() {
      return {
        compare(subject, other) {
          const result = { pass: isRectMostlyVBounded(massageRect(subject), massageRect(other)) }
          if (!result.pass) {
            result.message = 'first rect does not mostly vertically bound the second'
          }
          return result
        }
      }
    },

    toBeLeftOf() {
      return {
        compare(subject, other) {
          const result = { pass: massageRect(subject).right < (massageRect(other).left + 2) }
          if (!result.pass) {
            result.message = 'first rect is not left of the second'
          }
          return result
        }
      }
    },

    toBeRightOf() {
      return {
        compare(subject, other) {
          const result = { pass: massageRect(subject).left > (massageRect(other).right - 2) }
          if (!result.pass) {
            result.message = 'first rect is not right of the second'
          }
          return result
        }
      }
    }
  })
})
