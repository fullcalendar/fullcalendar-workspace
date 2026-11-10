# A Google Calendar ID or API URL given as a plain string source is fetched as a JSON feed

**Status:** confirmed
**Test:** `standard/.../src/event-sources/google-calendar.ts`
**Issues:** none found

Found during the test revamp. Pre-existing, also in v6.

The Google Calendar plugin's `parseMeta` recognizes a string source's URL as a calendar ID or Calendar API URL, but never gets the chance: built-in sources are global plugins, added after the calendar's own plugins, so the built-in JSON feed source claims the string first. The object form (`{ googleCalendarId }`) works.
