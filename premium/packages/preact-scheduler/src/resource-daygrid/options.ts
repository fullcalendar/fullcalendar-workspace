import {
  RawOptionsFromRefiners,
  RefinedOptionsFromRefiners,
} from '@fullcalendar/core/protected-api'
import { ClassNameGenerator } from '@fullcalendar/preact/public-api'
import {
  Identity,
  identity,
  ContentGenerator,
  DidMountHandler,
  WillUnmountHandler,
  refineClassNameGenerator,
} from '@fullcalendar/preact/protected-api'
import {
  ResourceDayHeaderInfo,
} from './structs'

export const OPTION_REFINERS = {
  resourceDayHeaderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceDayHeaderInfo>>,
  resourceDayHeaderInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceDayHeaderInfo>>,
  resourceDayHeaderContent: identity as Identity<ContentGenerator<ResourceDayHeaderInfo>>,
  resourceDayHeaderDidMount: identity as Identity<DidMountHandler<ResourceDayHeaderInfo>>,
  resourceDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceDayHeaderInfo>>,
  resourceDayHeaderAlign: identity as Identity<'start' | 'center' | 'end' | ((info: { level: number }) => 'start' | 'center' | 'end')>,
  // stickiness for cell-inner-contents laterally. experimental settings
  _resourceDayHeaderSticky: identity as Identity<boolean | number | string>,
}

export const OPTION_DEFAULTS = {
  // resourceDayHeaderAlign: 'start' as const, --- this default was inlined due to plugin ordering problems
  _resourceDayHeaderSticky: true,
}

type ResourceDayGridOptionRefiners = typeof OPTION_REFINERS
export type ResourceDayGridOptions = RawOptionsFromRefiners<ResourceDayGridOptionRefiners>
export type ResourceDayGridOptionsRefined = RefinedOptionsFromRefiners<ResourceDayGridOptionRefiners>
