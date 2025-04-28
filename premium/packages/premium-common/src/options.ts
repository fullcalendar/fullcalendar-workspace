import { RawOptionsFromRefiners, RefinedOptionsFromRefiners } from "@fullcalendar/core/internal"

export const OPTION_REFINERS = {
  schedulerLicenseKey: String,
}

type PremiumCommonOptionRefiners = typeof OPTION_REFINERS
export type PremiumOptions = RawOptionsFromRefiners<PremiumCommonOptionRefiners>
export type PremiumOptionsRefined = RefinedOptionsFromRefiners<PremiumCommonOptionRefiners>
