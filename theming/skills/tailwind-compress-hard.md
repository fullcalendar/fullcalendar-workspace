
Claude kept really screwing this one up. do manually.


## Compression 1: Break out common classNames

**ONLY do this if it SHORTENS the code!**

This compression is about extracting DUPLICATE classnames that appear in BOTH branches of a ternary.

GOOD EXAMPLE - Code gets shorter:

  BEFORE:
    [
      data.hasNavLink
        ? 'hover:bg-foreground/5 bold focus-visible:bg-foreground/5 -outline-offset-1'
        : 'hover:bg-foreground/5 italic'
    ]

  AFTER:
    [
      'hover:bg-foreground/5',
      data.hasNavLink
        ? 'bold focus-visible:bg-foreground/5 -outline-offset-1'
        : 'italic'
    ]

**BAD EXAMPLE - Code gets LONGER (do NOT do this!):**

  BEFORE (already optimal):
    listItemEventTimeClass: (data) => [
      data.isNarrow ? 'ps-0.5' : 'ps-1',
      'whitespace-nowrap overflow-hidden shrink-1',
    ]

  AFTER (WRONG - code is now longer!):
    listItemEventTimeClass: (data) => [
      data.isNarrow
        ? 'ps-0.5 whitespace-nowrap overflow-hidden shrink-1'
        : 'ps-1 whitespace-nowrap overflow-hidden shrink-1',
    ]

  This duplicated 'whitespace-nowrap overflow-hidden shrink-1' in BOTH branches!

**RULE: If a literal string appears OUTSIDE the ternary, LEAVE IT THERE. Do NOT inject it into both branches.**
