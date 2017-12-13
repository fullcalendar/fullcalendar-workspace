
// Test-running Utils
// --------------------------------------------------------------------------------------------------

window.optionsStack = null
window.currentCalendar = null

beforeEach(function() {
  window.optionsStack = []
})

window.pushOptions = function(options) { // FYI, too late to be called within an `it`
  beforeEach(function() {
    window.optionsStack.push(options)
  })
}

window.initCalendar = function(options, el) { // el is optional
  let $el
  if (options) {
    window.optionsStack.push(options)
  }

  if (el) {
    $el = $(el) // caller is responsible for eventually removing
  } else {
    $el = $('<div id="calendar">').appendTo('body')
  }

  // do this instead of the normal constructor,
  // so currentCalendar is available even before render
  const { Calendar } = $.fullCalendar
  window.currentCalendar = new Calendar($el, window.getCurrentOptions())
  window.currentCalendar.render()
}

window.getCurrentOptions = function() {
  return $.extend.apply($, [ {} ].concat(window.optionsStack))
}

afterEach(function() {
  if (window.currentCalendar) {
    window.currentCalendar.destroy()
    window.currentCalendar = null
  }
  $('#calendar').remove()
})

/*
describeOptions(optionName, descriptionAndValueHash, callback)
describeOptions(descriptionAndOptionsHash, callback)
*/
window.describeOptions = function(optName, hash, callback) {
  if ($.type(optName) === 'object') {
    callback = hash
    hash = optName
    optName = null
  }
  $.each(hash, function(desc, val) {
    let opts
    if (optName) {
      opts = {}
      opts[optName] = val
    } else {
      opts = val
    }
    opts = $.extend(true, {}, opts) // recursive clone
    describe(desc, function() {
      pushOptions(opts)
      callback(val)
    })
  })
}

window.describeValues = function(hash, callback) {
  $.each(hash, function(desc, val) {
    describe(desc, function() {
      callback(val)
    })
  })
}

// wraps an existing function in a spy, calling through to the function
window.spyCall = function(func) {
  func = func || function() {}
  const obj = { func }
  spyOn(obj, 'func').and.callThrough()
  return obj.func
}


// More FullCalendar-specific Utils
// --------------------------------------------------------------------------------------------------

const timezoneScenarios = {
  'none': {
    description: 'when no timezone',
    value: null,
    moment(str) {
      return $.fullCalendar.moment.parseZone(str)
    }
  },
  'local': {
    description: 'when local timezone',
    value: 'local',
    moment(str) {
      return moment(str)
    }
  },
  'UTC': {
    description: 'when UTC timezone',
    moment(str) {
      return moment.utc(str)
    }
  }
}

window.describeTimezones = function(callback) {
  $.each(timezoneScenarios, function(name, scenario) {
    describe(scenario.description, function() {
      pushOptions({ timezone: name })
      callback(scenario)
    })
  })
}

window.describeTimezone = function(name, callback) {
  const scenario = timezoneScenarios[name]
  describe(scenario.description, function() {
    pushOptions({ timezone: name })
    callback(scenario)
  })
}

window.isElWithinRtl = function(el) {
  return el.closest('.fc').hasClass('fc-rtl')
}


// Lang Utils
// --------------------------------------------------------------------------------------------------

window.oneCall = function(func) {
  let called = false
  return function() {
    if (!called) {
      called = true
      return func.apply(this, arguments)
    }
  }
}
