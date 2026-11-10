# The today button's accessible name doesn't contain its visible text

**Status:** open
**Issues:** none found

Found during the test revamp. Pre-existing. Not tested either way.

The today button shows "Today", but its `aria-label` is the `todayHint`, "This Month" / "This Week". WCAG 2.5.3 Label in Name (level A) wants the visible text inside the name, so speech-input users can say "click Today".

Options:

- **Start the name with the visible text,** e.g. "Today, this week". This changes `todayHint`'s output, or how the label is built, in every locale.
- **Use the visible text as the name,** and move the hint to `aria-description` or `title`.
- **Leave it.**

More context: `../archive/agent-notes/gaps-a11y-sticky.md`.
