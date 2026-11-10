# Under React, `moreLinkClick`'s `jsEvent` is a SyntheticEvent

**Status:** confirmed
**Release:** next
**Test:** `standard/.../src/more-link/click.ts` (`it.fails` under `FORCE_REACT=1` only)
**Issues:** none found

Found during the test revamp. Pre-existing.

With the React renderer, `moreLinkClick`'s `jsEvent` is React's SyntheticEvent rather than the native event, unlike the Preact renderer and the type.
