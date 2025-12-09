
Remove the "base" @layer and everything within it.

Remove all other @layer wrappings. All statements within should be moved to top-level. Ensure you adjust indentation.

Remove the crazy @supports wrapper at the top of the file. All statements within should be moved to top-level. Ensure you adjust indentation.

Remove all @property declarations at the end of the file.

There's a block near the top of the file with the selector `:root,:host` (most likely second block). It contains many CSS variables.

  Take all the variables there EXCEPT those that follow the format --text-*--line-height
  Inline them throughout the file and further evaluate any calc statements as a result. Example:
    BEFORE:
      padding-inline: calc(var(--spacing)*2)
    AFTER:
      padding-inline: calc(.5rem)

  Take the --text-*--line-height variables and inline them like this:
    Given
      --text-xs--line-height: calc(1/.75)
    And this line later:
      line-height: var(--tw-leading, var(--text-xs--line-height))
    The resulting line should be:
      line-height: calc(1/.75)
    Thus we are inlining the value but keeping the calc. We're also removing the fallback to --tw-leading

Add this very simple set of reset classes to the top of the file along with the comments I wrote:

  /*
  NOTE: apply this to calendar root AND popover
  */
  .reset-root {
    line-height: 1.5;
    --tw-border-style: solid;
  }

  /*
  NOTE: apply this to buttonClass and popoverCloseClass
  */
  .button-reset {
    appearance: button;
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    opacity: 1;
    background-color: #0000;
    border-radius: 0;
    border: 0 /* originally provided on border-box reset */
  }

Now we'll update the corresponding index.tsx in the same directory to USE these reset classes.
If that file doesn't exist, look for EventCalendarView.tsx in the same directory (in the case of MUI).
Do this to the file:

  add reset-root to the end of the declarations for `className` and `popoverClass`

  add button-reset to the end of the first string literal declarations for `buttonClass` and `popoverCloseClass`

There's a block near the top of the file with the selector `*,:before,:after,::backdrop`

  Simplify this selector by changing it do just `*`

  Sort all the declarations in that block alphabetically.

  Remove the following declarations from this block:
    --tw-border-style
      Keep uses of it throughout the file
    --tw-font-weight
      Remove all uses of it from code throughout the file
    --tw-inset-ring-color
      Keep uses of it throughout the file
    --tw-inset-ring-shadow
      Keep uses of it throughout the file
    --tw-inset-shadow
      Keep uses of it throughout the file
    --tw-inset-shadow-alpha
      Alert if uses in the file
    --tw-inset-shadow-color
      Alert if uses in the file
    --tw-outline-style
      Replace with `solid` throughout the file
    --tw-ring-color
      Keep uses of it throughout the file
    --tw-ring-inset
      Look at all uses, probably something like this:
        var(--tw-ring-inset, )
      Just remove those!
    --tw-ring-offset-color
      Alert if uses in the file
    --tw-ring-offset-shadow
      Keep uses of it throughout the file
    --tw-ring-offset-width
      Inline uses of it throughout the file, further evaluating any calc expressions
    --tw-ring-shadow
      Keep uses of it throughout the file
    --tw-shadow
      Keep uses of it throughout the file
    --tw-shadow-alpha
      Alert if uses in the file
    --tw-shadow-color
      Look at all uses, probably something like this:
        var(--tw-shadow-color, #0000001a)
      Remove --tw-shadow-color and simplify to the fallback value like this:
        #0000001a

  The `*` block should now be empty. If so, remove it. If not, alert me.

Look at all shadow, ring, and outline declarations that follow this form:

  .shadow-lg { /* or whatever ring or outline classname */
    --tw-shadow: blablablabla; /* or --tw-ring-shadow or whatever */
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)
  }

Simply make the value of the box-shadow the value of the selector like this:

  .shadow-lg {
    box-shadow: blablablabla;
  }

Look at all vars throughout the file prefixed with --tw-

  Replace that prefix with --fc-<themename>-
  Get the theme name from the name of the current directory's parent (or the current directory itself in the case of MUI)

  So if the variable was called:
    --tw-border-style
  Then you'd rename to this:
    --fc-<themename>-border-style
  Example for the "forma" theme:
    --fc-forma-border-style
