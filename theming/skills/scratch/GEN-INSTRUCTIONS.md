
### String Literals

- **Use regular quotes** (`'` or `"`) instead of template literals (backticks) unless the string contains interpolation (`${...}`).

- **JSX props**: Use literal string props (e.g., `propName='value'`) rather than wrapping in curly braces (e.g., `propName={'value'}` or `propName={\`value\`}`).

- **Single quotes for JSX**: Always use single quotes for JSX string props (e.g., `propName='value'`) instead of double quotes.

- **`joinClassNames` usage**:
  - It's acceptable to use `joinClassNames` with multiple literal strings when you want to keep them on separate lines for readability and to avoid overly long lines.
  - Avoid `joinClassNames` when there's only a single string argument or when arguments include empty strings (e.g., `joinClassNames('string', '')` should just be `'string'`).
  - Use `joinClassNames` when you need to conditionally combine strings or when mixing strings with variables/expressions.

- **Conditional classname optimization**:
  - **Extract common classnames**: If a conditional expression (ternary operator) has common classnames in both branches, extract the common part and place it before the conditional. For example:
    ```js
    // BEFORE
    data.hasNavLink
      ? 'hover:bg-foreground/5 bold focus-visible:bg-foreground/5 -outline-offset-1'
      : 'hover:bg-foreground/5 italic'

    // AFTER
    'hover:bg-foreground/5',
    data.hasNavLink
      ? 'bold focus-visible:bg-foreground/5 -outline-offset-1'
      : 'italic'
    ```
  - **Use boolean operators for empty branches**: If one branch of a ternary is completely empty, use a boolean operator instead. For example:
    ```js
    // BEFORE
    data.isMajor ? 'border-foreground/20' : ''

    // AFTER
    data.isMajor && 'border-foreground/20'
    ```
  - **Simplify nested ternaries with empty branches**: When you have nested ternaries where one branch returns an empty string and another returns a value, you can simplify by combining the conditions that should return the value. For example:
    ```js
    // BEFORE
    data.isOther
      ? 'text-muted-foreground'
      : (data.monthText ? '' : 'text-muted-foreground')

    // AFTER
    (data.isOther || !data.monthText) && 'text-muted-foreground'
    ```
    The logic: the value is returned when `data.isOther` is true OR when `data.isOther` is false AND `data.monthText` is false, which simplifies to `data.isOther || !data.monthText`.
  - **Important**: Apply the common classname extraction (#1) before the empty branch optimization (#2), as #1 may generate empty expressions that need to be cleaned up by #2.
