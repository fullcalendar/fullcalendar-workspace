import { RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/preact/protected-api'

export const OPTION_REFINERS = {
  schedulerLicenseKey: String,
  virtualization: Boolean,
}

type PremiumCommonOptionRefiners = typeof OPTION_REFINERS
export type PremiumOptions = RawOptionsFromRefiners<PremiumCommonOptionRefiners>
export type PremiumOptionsRefined = RefinedOptionsFromRefiners<PremiumCommonOptionRefiners>
