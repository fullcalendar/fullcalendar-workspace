import * as $ from 'jquery'
import * as moment from 'moment'
import * as exportHooks from 'fullcalendar'

const RELEASE_DATE = '<%= releaseDate %>' // for Scheduler
const UPGRADE_WINDOW = { years: 1, weeks: 1 } // 1 week leeway, for tz shift reasons too
const LICENSE_INFO_URL = 'http://fullcalendar.io/scheduler/license/'
const PRESET_LICENSE_KEYS = [
  'GPL-My-Project-Is-Open-Source',
  'CC-Attribution-NonCommercial-NoDerivatives'
]


export function processLicenseKey(key, containerEl) {
  if (!isImmuneUrl(window.location.href) && !isValidKey(key)) {
    if (!detectWarningInContainer(containerEl)) {
      return renderingWarningInContainer(
        'Please use a valid license key. <a href="' + LICENSE_INFO_URL + '">More Info</a>',
        containerEl
      )
    }
  }
}

/*
This decryption is not meant to be bulletproof. Just a way to remind about an upgrade.
*/
export function isValidKey(key) {
  if ($.inArray(key, PRESET_LICENSE_KEYS) !== -1) {
    return true
  }
  const parts = (key || '').match(/^(\d+)\-fcs\-(\d+)$/)
  if (parts && (parts[1].length === 10)) {
    const purchaseDate = moment.utc(parseInt(parts[2], 10) * 1000)
    const releaseDate = moment.utc((exportHooks as any).mockSchedulerReleaseDate || RELEASE_DATE)
    if (releaseDate.isValid()) { // token won't be replaced in dev mode
      const minPurchaseDate = releaseDate.clone().subtract(UPGRADE_WINDOW)
      if (purchaseDate.isAfter(minPurchaseDate)) {
        return true
      }
    }
  }
  return false
}


export function isImmuneUrl(url) {
  return /\w+\:\/\/fullcalendar\.io\/|\/demos\/[\w-]+\.html$/.test(url)
}


export function renderingWarningInContainer(messageHtml, containerEl) {
  return containerEl.append(
    $('<div class="fc-license-message" />').html(messageHtml)
  )
}


// returns boolean of whether a license message is already rendered
export function detectWarningInContainer(containerEl) {
  return containerEl.find('.fc-license-message').length >= 1
}
