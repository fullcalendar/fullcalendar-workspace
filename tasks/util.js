
exports.mapHashVals = function(hash, func) {
  let vals = []

  for (let key in hash) {
    vals.push(
      func(hash[key], key)
    )
  }

  return vals
}

exports.filterHash = function(hash, func) {
  let res = {}

  for (let key in hash) {
    if (func(hash[key], key)) {
      res[key] = hash[key]
    }
  }

  return res
}


// Process template tags like <%= my.var.name %>

exports.renderSimpleTemplate = function(content, vars) {
  return content.replace(
    /<%=\s*([\w.]+)\s*%>/g,
    function(wholeMatch, varName) {
      return querySubProperty(vars, varName) || ''
    }
  )
}

function querySubProperty(obj, propStr) {
  let remainingParts = propStr.split('.')
  let retVal = obj

  while (remainingParts.length && retVal) {
    retVal = retVal[remainingParts.shift()]
  }

  return retVal
}
