
function initThemeChooser() {
  var currentStylesheetEl
  var loadingEl = document.getElementById('loading')
  var themeSelectEl = document.querySelector('.selector select')

  setTheme(themeSelectEl.value)
  themeSelectEl.addEventListener('change', function() {
    setTheme(themeSelectEl.value)
  })

  function setTheme(themeName) {
    var stylesheetUrl = generateStylesheetUrl(themeName)
    var stylesheetEl

    function done() {
      showCredits(themeName)
    }

    if (stylesheetUrl) {
      stylesheetEl = document.createElement('link')
      stylesheetEl.setAttribute('rel', 'stylesheet')
      stylesheetEl.setAttribute('href', stylesheetUrl)
      document.querySelector('head').appendChild(stylesheetEl)

      loadingEl.style.display = 'inline'

      whenStylesheetLoaded(stylesheetEl, function() {
        if (currentStylesheetEl) {
          currentStylesheetEl.parentNode.removeChild(currentStylesheetEl)
        }
        currentStylesheetEl = stylesheetEl
        loadingEl.style.display = 'none'
        done()
      })
    } else {
      if (currentStylesheetEl) {
        currentStylesheetEl.parentNode.removeChild(currentStylesheetEl)
        currentStylesheetEl = null
      }
      done()
    }
  }

  function generateStylesheetUrl(themeName) {
    if (themeName) {
      return 'https://bootswatch.com/5/' + themeName + '/bootstrap.min.css'
    } else { // the default bootstrap theme
      return 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/css/bootstrap.min.css'
    }
  }

  function showCredits(themeName) {
    var creditId = 'bootstrap' + (themeName ? '-custom' : '')

    Array.prototype.slice.call( // convert to real array
      document.querySelectorAll('.credits'),
    ).forEach(function(creditEl) {
      if (creditEl.getAttribute('data-credit-id') === creditId) {
        creditEl.style.display = 'block'
      } else {
        creditEl.style.display = 'none'
      }
    })
  }

  function whenStylesheetLoaded(linkNode, callback) {
    var isReady = false

    function ready() {
      if (!isReady) { // avoid double-call
        isReady = true
        callback()
      }
    }

    linkNode.onload = ready // does not work cross-browser
    setTimeout(ready, 2000) // max wait. also handles browsers that don't support onload
  }
}
