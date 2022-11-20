#!/bin/bash

# exit upon error
set -e

parent_dir="$(dirname $0)"
proj_dir="$parent_dir/angular"

if [[ -d "$proj_dir" ]]; then
  echo
  echo "Directory '$proj_dir' already exists. Please move or delete it, then start over."
  echo
  exit 1
fi

echo
echo "In the following prompts, choose NO for routing, then select CSS."
echo

cd "$parent_dir"
ng new @fullcalendar/angular \
  --directory angular \
  --new-project-root . \
  --create-application=false \
  --skip-install
cd angular
ng generate library lib --skip-install
ng generate application app --skip-install
