import { DateEnv } from '@full-ui/headless-calendar'
import { useMemo } from 'react'
import { DateProfile, computeMajorUnit } from '../../DateProfileGenerator'
import { HiddenDays } from '../../structs/hidden-days'
import { useViewContext } from '../../hooks/useViewContext'
import { DayTableModel, buildDayTableModel } from './model'

// DayGrid's plain model: rows of weeks for year/month/week ranges, one row otherwise
export function useDayGridModel(dateProfile: DateProfile): DayTableModel {
  const { dateProfileGenerator, dateEnv } = useViewContext()
  const { hiddenDays } = dateProfileGenerator

  return useMemo(
    () => buildDayGridModel(dateProfile, hiddenDays, dateEnv),
    [dateProfile, hiddenDays, dateEnv],
  )
}

export function buildDayGridModel(dateProfile: DateProfile, hiddenDays: HiddenDays, dateEnv: DateEnv): DayTableModel {
  const breakOnWeeks = /year|month|week/.test(dateProfile.currentRangeUnit)
  const majorUnit = !breakOnWeeks && computeMajorUnit(dateProfile, dateEnv)

  return buildDayTableModel(dateProfile, hiddenDays, dateEnv, {
    breakOnWeeks,
    // Exclude 'day': when cells are themselves days, all would match and the boundary
    // distinction is meaningless (unlike timeline slots which can be sub-day).
    majorUnit: majorUnit !== 'day' ? majorUnit || undefined : undefined,
  })
}

// TimeGrid's plain model: one row of slot-widened date columns, none major
export function useTimeGridModel(dateProfile: DateProfile): DayTableModel {
  const { dateProfileGenerator, dateEnv } = useViewContext()
  const { hiddenDays } = dateProfileGenerator

  return useMemo(
    () => buildDayTableModel(dateProfile, hiddenDays, dateEnv, {
      breakOnWeeks: false,
      slotRange: dateProfile,
    }),
    [dateProfile, hiddenDays, dateEnv],
  )
}
