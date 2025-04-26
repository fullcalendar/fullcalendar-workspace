#!/bin/bash

set -e
cd "`dirname $0`/../.."
root_dir=`pwd`

version="6.1.10"

declare -a tag_dirs=( \
  "$root_dir/standard" \
  "$root_dir/contrib/angular" \
  "$root_dir/contrib/react" \
  "$root_dir/contrib/vue3" \
  "$root_dir" \
)

for tag_dir in ${tag_dirs[@]}; do
  echo "Creating and pushing tag $tag in $tag_dir..."
  cd "$tag_dir"
  git tag -a "v$version" -m "v$version"
  git push origin "v$version"
done

declare -a release_repos=( \
  "fullcalendar/fullcalendar-angular" \
  "fullcalendar/fullcalendar-react" \
  "fullcalendar/fullcalendar-vue" \
  "fullcalendar/fullcalendar-workspace" \
)

for release_repo in ${release_repos[@]}; do
  echo "Creating release $tag in $release_repo..."
  gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$release_repo/releases" \
    -f tag_name="v$version" \
    -f name="v$version" \
    -f body="See https://github.com/fullcalendar/fullcalendar/releases/tag/v$version" \
    -f make_latest=true
done

echo
echo "DONE"
echo
echo "TODO:"
echo " - In fullcalendar/fullcalendar, create release and upload zip"
echo " - In fullcalendar/fullcalendar-workspace, upload zip"
echo
