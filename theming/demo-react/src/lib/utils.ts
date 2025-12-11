import { joinClassNames } from '@fullcalendar/core'

export function flattenClassName(
  { class: cl, className: cn }: { class?: string | undefined, className?: string | undefined }
): string {
  return joinClassNames(
    Array.isArray(cl) ? joinClassNames(...cl) : cl,
    Array.isArray(cn) ? joinClassNames(...cn) : cn,
  )
}
