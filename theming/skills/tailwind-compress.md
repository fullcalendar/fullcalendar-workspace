
GOAL: compress classname inputs for joinClassNames, cn, and the *Class props:

  joinClassNames(
    'someclass',
    props.isSmall && 'someconditionalclass'
  )

  // works exactly the same as joinClassNames
  cn(
    'someclass',
    props.isSmall && 'someconditionalclass'
  )

  // array given directly to a prop
  dayHeaderClass: [
    'someclass',
    props.isSmall && 'someconditionalclass'
  ]

In all the example going forward, we'll use the array notation, but please know the compression must happen for ALL types of class-array definitions.

Whatever technique you start out with, be it joinClassNames, cn, or *Class props, **maintain the same technique for the compression**.
**DO NOT** convert from a joinClassName -> cn, or a joinClassName -> a string array.

The *Class props also accept direct strings like this:

  dayHeaderClass: 'someclass'

  dayHeaderClass: (props) => props.isSmall && 'someconditionalclass'

Apply compression techniques to these as well.


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

## Compression 2: Convert ternary to boolean

When there's an empty ('') branch.

BEFORE:

  data.isMajor ? 'border-foreground/20' : ''

AFTER:

  data.isMajor && 'border-foreground/20'


## Compression 3: Ternary/boolean collapse

Further compression when there's an empty ('') branch.

BEFORE:

  data.isOther
    ? 'text-muted-foreground'
    : (data.monthText ? '' : 'text-muted-foreground')

AFTER:

  (data.isOther || !data.monthText) && 'text-muted-foreground'


## Compression 4: Eliminate blank strings

BEFORE:
  [
    'someclass',
    '',
    props.isSmall && 'someconditionalclass'
  ]

AFTER:
  [
    'someclass',
    props.isSmall && 'someconditionalclass'
  ]


## Compression 5: Combine mutliple literal strings

  Do this for consecutive literal string:

    BEFORE:
      [
        'someclass',
        'anotherclass',
        props.isSmall && 'someconditionalclass'
      ]

    AFTER:
      [
        'someclass anotherclass',
        props.isSmall && 'someconditionalclass'
      ]

  Do this for non-consecutive literal strings as well. Move all strings to the location of the FIRST string:

    BEFORE:
      [
        props.isSmall && 'someconditionalclass'
        'someclass',
        props.isBig && 'anotherconditionalclass'
        'anotherclass',
      ]

    AFTER:
      [
        props.isSmall && 'someconditionalclass'
        'someclass anotherclass',
        props.isBig && 'anotherconditionalclass'
      ]

# Compression 6: Combine non-conditional list into one string

If a class list as either literal strings or const, but ZERO conditiona/ternary expression, combine into one string.

Simple case:

  BEFORE:
    dayHeaderClass: [
      'someclass',
      'anotherclass',
    ]

  AFTER:
    dayHeaderClass: 'someclass anotherclass'

With consts:

  BEFORE:
    dayHeaderClass: [
      'someclass',
      coolConst,
      'anotherclass',
    ]

  AFTER:
    dayHeaderClass: `someclass ${coolConst} anotherclass`

  Even do that if ALL items are consts!

When there's already a conditional/ternary items, keep items distinct

  // don't compress this! leave as an array
  [
    props.isSmall && 'someconditionalclass',
    'someclass',
    coolConst,
    anotherConst,
  ]
