#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

# remove the symlink created by a previous after-script run
# because `npm install` will complain about it (happens next).
if [[ -L "node_modules/fullcalendar" ]]
then
	echo "Removing 'node_modules/fullcalendar' symlink."
	rm "node_modules/fullcalendar"
fi
