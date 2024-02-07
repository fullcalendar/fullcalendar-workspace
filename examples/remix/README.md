
# FullCalendar Remix Example

FullCalendar works well with the React framework [Remix](https://remix.run/).
A workaround is required (see below).


## Installation

```bash
git clone https://github.com/fullcalendar/fullcalendar-examples.git
cd fullcalendar-examples/remix
npm install
```


## Build Commands

```
npm run dev # watch and rebuild while developing
npm run build # build for production
npm run start # run the production build
npm run typecheck # typecheck source files
```


## Workaround Explained

Remix must be told the exact destination of the FullCalendar-generated styles within the DOM.
Add the following line to `app/root.tsx`:

```tsx
function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        {title ? <title>{title}</title> : null}
        <Meta />
        <style data-fullcalendar />{/* ADD THIS LINE */}
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
```
