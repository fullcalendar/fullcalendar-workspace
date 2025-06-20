import { config, isValidDate, addDays, CalendarContext, joinArrayishClassNames } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'

const UPGRADE_WINDOW = 365 + 7 // days. 1 week leeway, for tz shift reasons too
const INVALID_LICENSE_URL = 'https://fullcalendar.io/docs/schedulerLicenseKey#invalid'
const OUTDATED_LICENSE_URL = 'https://fullcalendar.io/docs/schedulerLicenseKey#outdated'
const PRESET_LICENSE_KEYS = [
  'AGPL-My-Frontend-And-Backend-Are-Open-Source',
  'CC-Attribution-NonCommercial-NoDerivatives',
]

export function buildLicenseWarning(context: CalendarContext) {
  const { options, pluginHooks } = context
  const key = options.schedulerLicenseKey
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  if (!isImmuneUrl(currentUrl)) {
    const status = processLicenseKey(key, pluginHooks.premiumReleaseDate!)
    let statusText: string
    let statusUrl: string

    if (status === 'outdated') {
      statusText = 'Your license key is too old to work with this version.'
      statusUrl = OUTDATED_LICENSE_URL
    } else {
      statusText = 'Your license key is invalid.'
      statusUrl = INVALID_LICENSE_URL
    }

    if (status !== 'valid') {
      return (
        <div
          className={joinArrayishClassNames(
            options.popoverClass,
            classNames.popoverZ,
            classNames.abs,
            classNames.noPadding,
          )}
          style={{
            bottom: 0,
            left: 0, // TODO: use direction-aware start
          }}
        >
          <div className={joinArrayishClassNames(
            options.popoverHeaderClass,
            classNames.tight, // no margin/padding
          )}>
            <div style={{
              padding: '5px',
              fontSize: '12px',
              lineHeight: '1em',
            }}>
              {statusText}{' '}
              <a
                href={statusUrl}
                style={{
                  textDecoration: 'underline',
                }}
              >More Info</a>
            </div>
          </div>
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
