import { ClassNameInput, joinClassNames } from '@fullcalendar/core'

export function flattenClassName(
  { class: cl, className: cn }: { class?: ClassNameInput, className?: ClassNameInput }
): string {
  return joinClassNames(
    Array.isArray(cl) ? joinClassNames(...cl) : cl,
    Array.isArray(cn) ? joinClassNames(...cn) : cn,
  )
}
