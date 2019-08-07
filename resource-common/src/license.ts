import { config, Calendar, appendToElement, isValidDate, addDays, cssToStr, htmlEscape } from '@fullcalendar/core'

const RELEASE_DATE = '<%= releaseDate %>' // for Scheduler
const UPGRADE_WINDOW = 365 + 7 // days. 1 week leeway, for tz shift reasons too
const LICENSE_INFO_URL = 'http://fullcalendar.io/scheduler/license/'
const PRESET_LICENSE_KEYS = [
  'GPL-My-Project-Is-Open-Source',
  'CC-Attribution-NonCommercial-NoDerivatives'
]
const CSS = {
  position: 'absolute',
  'z-index': 99999,
  bottom: '1px',
  left: '1px',
  background: '#eee',
  'border-color': '#ddd',
  'border-style': 'solid',
  'border-width': '1px 1px 0 0',
  padding: '2px 4px',
  'font-size': '12px',
  'border-top-right-radius': '3px'
}


export function injectLicenseWarning(containerEl: HTMLElement, calendar: Calendar) {
  let key = calendar.opt('schedulerLicenseKey')

  if (!isImmuneUrl(window.location.href) && !isValidKey(key)) {
    appendToElement(
      containerEl,
      '<div class="fc-license-message" style="' + htmlEscape(cssToStr(CSS)) + '">' +
      'Please use a valid license key. <a href="' + LICENSE_INFO_URL + '">More Info</a>' +
      '</div>'
    )
  }
}


/*
This decryption is not meant to be bulletproof. Just a way to remind about an upgrade.
*/
function isValidKey(key) {
  if (PRESET_LICENSE_KEYS.indexOf(key) !== -1) {
    return true
  }
  const parts = (key || '').match(/^(\d+)\-fcs\-(\d+)$/)
  if (parts && (parts[1].length === 10)) {
    const purchaseDate = new Date(parseInt(parts[2], 10) * 1000)
    const releaseDate = new Date(config.mockSchedulerReleaseDate || RELEASE_DATE)

    if (isValidDate(releaseDate)) { // token won't be replaced in dev mode
      const minPurchaseDate = addDays(releaseDate, -UPGRADE_WINDOW)
      if (minPurchaseDate < purchaseDate) {
        return true
      }
    }
  }
  return false
}


function isImmuneUrl(url) {
  return /\w+\:\/\/fullcalendar\.io\/|\/examples\/[\w-]+\.html$/.test(url)
}
