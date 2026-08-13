// Phase 1 compile validation. The real Timeline adapter replaces this smoke
// import in Phase 4/5.
export type {
  SourceSeg,
  UnorderedSeg,
  Slice,
  Placement,
  PlacementLevel,
  PlacementLayout,
  LayoutLimitResult,
  HiddenSliceGroup,
  SliceOptions,
  DomCandidatePlan,
  TimelineMoreLinkPlacement,
  TimelineLimitResult,
  TimelineMoreLinkHeightMap,
  TimelineLayoutOptions,
} from '@fullcalendar/preact/protected-api'
export {
  positionSegs,
  positionSegsWithUnitThickness,
  stampEventOrder,
  planDomCandidatesByMaxLevel,
  orderTimeAxisItems,
  orderResolvedEventItems,
  doesSliceCoverWholeSource,
  groupHiddenSlices,
  limitTimelineLayoutByMaxLevel,
  positionTimelineMoreLinks,
  calculateTimelineContentHeight,
} from '@fullcalendar/preact/protected-api'
