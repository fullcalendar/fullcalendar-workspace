#!/bin/bash

set -e
cd "`dirname $0`/../.."
root_dir=`pwd`

version="6.1.9"

declare -a tag_dirs=( \
  "$root_dir/contrib/standard" \
  "$root_dir/contrib/angular" \
  "$root_dir/contrib/react" \
  "$root_dir/contrib/vue2" \
  "$root_dir/contrib/vue3" \
  "$root_dir" \
)

for tag_dir in ${tag_dirs[@]}; do
  echo "Pushing tag $tag in $tag_dir..."
  cd "$tag_dir"
  git tag -a "$version" -m "$version"
  git push origin "$version"
done

declare -a release_repos=( \
  "fullcalendar/fullcalendar-angular" \
  "fullcalendar/fullcalendar-react" \
  "fullcalendar/fullcalendar-vue" \
  "fullcalendar/fullcalendar-vue2" \
  "fullcalendar/fullcalendar-workspace" \
)

for release_repo in ${release_repos[@]}; do
  echo "Creating release $tag in $release_repo..."
  gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$release_repo/releases" \
    -f tag_name="$version" \
    -f name="$version" \
    -f body="See https://github.com/fullcalendar/fullcalendar/releases/tag/$version" \
    -f make_latest=true
done

echo
echo "DONE"
echo
echo "TODO:"
echo " - In fullcalendar/fullcalendar, create release and upload zip"
echo " - In fullcalendar/fullcalendar-workspace, upload zip"
echo
