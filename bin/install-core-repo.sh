#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

if [[ -f fullcalendar-branch.txt ]]; then
  CORE_REF=$(cat fullcalendar-branch.txt)
elif
  CORE_REF="v$(npm show fullcalendar version)"
fi

if [[ -L 'fullcalendar' ]]; then
  echo "Clearing symlink."
  rm 'fullcalendar'
fi

if [[ ! -d 'fullcalendar' ]]; then
  git clone "https://github.com/fullcalendar/fullcalendar.git"
fi

cd fullcalendar
git fetch origin
git checkout -q "$CORE_REF"
gulp dist

echo "Successfully checked out $CORE_REF"
