# Prev, next and today are announced as toggle buttons

**Status:** confirmed
**Release:** next
**Test:** `standard/.../src/accessibility/aria.ts`
**Issues:** [#8042](https://github.com/fullcalendar/fullcalendar/issues/8042) (open), [#6521](https://github.com/fullcalendar/fullcalendar/issues/6521) (closed, related: where `aria-pressed` was introduced)

Found during the test revamp. Pre-existing. Checked in both renderers.

Prev, next and today (any button not in a group of only view buttons) get `aria-pressed="false"`, in their own groups and when grouped with view buttons, so screen readers announce them as toggle buttons that aren't pressed.

`ToolbarSection.tsx` gives every non-tab button `'aria-pressed': isSelected`. Only view buttons should have a pressed or selected state: `aria-selected` as tabs in a view-only group, `aria-pressed` in a mixed group. Prev, next and today should get no `aria-pressed`.

Adam (2026-10-20): fix this at the end of the project.
