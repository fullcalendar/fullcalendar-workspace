import * as core from 'fullcalendar'

const RELEASE_DATE = '<%= releaseDate %>' // for Scheduler
const UPGRADE_WINDOW = 365 + 7 // days. 1 week leeway, for tz shift reasons too
const LICENSE_INFO_URL = 'http://fullcalendar.io/scheduler/license/'
const PRESET_LICENSE_KEYS = [
  'GPL-My-Project-Is-Open-Source',
  'CC-Attribution-NonCommercial-NoDerivatives'
]


export function processLicenseKey(key, containerEl: HTMLElement) {
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
function isValidKey(key) {
  if (PRESET_LICENSE_KEYS.indexOf(key) !== -1) {
    return true
  }
  const parts = (key || '').match(/^(\d+)\-fcs\-(\d+)$/)
  if (parts && (parts[1].length === 10)) {
    const purchaseDate = new Date(parseInt(parts[2], 10) * 1000)
    const releaseDate = new Date((core as any).mockSchedulerReleaseDate || RELEASE_DATE)

    if (!isNaN(releaseDate.valueOf())) { // token won't be replaced in dev mode
      const minPurchaseDate = core.addDays(releaseDate, UPGRADE_WINDOW)
      if (minPurchaseDate < purchaseDate) {
        return true
      }
    }
  }
  return false
}


function isImmuneUrl(url) {
  return /\w+\:\/\/fullcalendar\.io\/|\/demos\/[\w-]+\.html$/.test(url)
}


function renderingWarningInContainer(messageHtml, containerEl: HTMLElement) {
  core.appendToElement(containerEl, '<div class="fc-license-message">' + messageHtml + '</div>')
}


// returns boolean of whether a license message is already rendered
function detectWarningInContainer(containerEl: HTMLElement) {
  return Boolean(containerEl.querySelector('.fc-license-message'))
}
