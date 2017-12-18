#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

if [[ -f fullcalendar-branch.txt ]]; then
  CORE_REF="origin/$(cat fullcalendar-branch.txt)"
else
  CORE_REF="v$(npm show fullcalendar version)"
fi

if [[ -L 'fullcalendar' ]]; then
  echo "Clearing symlink."
  rm 'fullcalendar'
fi

# NOTE: TravisCI will have empty dir populated on first run
if [[ ! -d 'fullcalendar' ]]; then
  echo "Creating fullcalendar directory."
  mkdir "fullcalendar"
fi

cd "fullcalendar"

if [[ ! -d ".git" ]]; then
  echo "Cloning fresh fullcalendar repo."
  git clone "https://github.com/fullcalendar/fullcalendar.git" .
else
  echo "Fetching latest from fullcalendar repo."
  git fetch origin --tags
fi

# do build tasks within fullcalendar dir
git checkout --quiet "$CORE_REF"
npm install
npm run dist

echo "Successfully built $CORE_REF"
