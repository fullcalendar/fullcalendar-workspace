import { config, isValidDate, addDays, CalendarContext } from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'

const UPGRADE_WINDOW = 365 + 7 // days. 1 week leeway, for tz shift reasons too
const INVALID_LICENSE_URL = 'https://fullcalendar.io/docs/schedulerLicenseKey#invalid'
const OUTDATED_LICENSE_URL = 'https://fullcalendar.io/docs/schedulerLicenseKey#outdated'
const PRESET_LICENSE_KEYS = [
  'GPL-My-Project-Is-Open-Source',
  'CC-Attribution-NonCommercial-NoDerivatives',
]
const CSS = {
  position: 'absolute',
  zIndex: 99999,
  bottom: '1px',
  left: '1px',
  background: '#eee',
  borderColor: '#ddd',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 0',
  padding: '2px 4px',
  fontSize: '12px',
  borderTopRightRadius: '3px',
}

export function buildLicenseWarning(context: CalendarContext) {
  let key = context.options.schedulerLicenseKey
  let currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  if (!isImmuneUrl(currentUrl)) {
    let status = processLicenseKey(key, context.pluginHooks.premiumReleaseDate!)

    if (status !== 'valid') {
      return (
        <div className="fc-license-message" style={CSS}>
          {(status === 'outdated') ? (
            <Fragment>
              {'Your license key is too old to work with this version. '}
              <a href={OUTDATED_LICENSE_URL}>More Info</a>
            </Fragment>
          ) : (
            <Fragment>
              {'Your license key is invalid. '}
              <a href={INVALID_LICENSE_URL}>More Info</a>
            </Fragment>
          )}
        </div>
      )
    }
  }

  return null
}

/*
This decryption is not meant to be bulletproof. Just a way to remind about an upgrade.
*/
function processLicenseKey(key, premiumReleaseDate: Date) {
  if (PRESET_LICENSE_KEYS.indexOf(key) !== -1) {
    return 'valid'
  }

  const parts = (key || '').match(/^(\d+)-fcs-(\d+)$/)

  if (parts && (parts[1].length === 10)) {
    const purchaseDate = new Date(parseInt(parts[2], 10) * 1000)
    const releaseDate = config.mockSchedulerReleaseDate || premiumReleaseDate

    if (isValidDate(releaseDate)) { // token won't be replaced in dev mode
      const minPurchaseDate = addDays(releaseDate, -UPGRADE_WINDOW)

      if (minPurchaseDate < purchaseDate) {
        return 'valid'
      }

      return 'outdated'
    }
  }

  return 'invalid'
}

function isImmuneUrl(url) {
  return /\w+:\/\/fullcalendar\.io\/|\/examples\/[\w-]+\.html$/.test(url)
}
