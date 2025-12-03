
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


## Compression: Convert ternary to boolean

When there's an empty ('') branch.

BEFORE:

  data.isMajor ? 'border-foreground/20' : ''

AFTER:

  data.isMajor && 'border-foreground/20'


## Compression: Ternary/boolean collapse

Further compression when there's an empty ('') branch.

BEFORE:

  data.isOther
    ? 'text-muted-foreground'
    : (data.monthText ? '' : 'text-muted-foreground')

AFTER:

  (data.isOther || !data.monthText) && 'text-muted-foreground'


## Compression: Eliminate blank strings

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


## Compression: Combine mutliple literal strings

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

# Compression: Combine non-conditional list into one string

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

# Compression: Identical branch evaluations

BEFORE:
  [
    someConst,
    data.isInteractive
      ? 'hover:bg-foreground/5'
      : 'hover:bg-foreground/5',
  ]

AFTER:
  [
    someConst,
    'hover:bg-foreground/5',
  ]


# Compression:

Sometimes whole component properties will results in an empty string. Remove them

  <FullCalendar
    listItemEventTitleClass='' // remove this!!!
  />
