#!/usr/bin/env sh
set -eu

assets_dir="${RUM_ASSETS_DIR:-public/assets}"
zip_path="${RUM_SOURCEMAP_ZIP:-rum-sourcemaps.zip}"
case "$zip_path" in
  /*) zip_target="$zip_path" ;;
  *) zip_target="$(pwd)/$zip_path" ;;
esac

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required to package OpenObserve RUM source maps." >&2
  exit 1
fi

if [ ! -d "$assets_dir" ]; then
  echo "Asset directory not found: $assets_dir" >&2
  exit 1
fi

has_js=false
missing_maps=false
for js_file in "$assets_dir"/*.js; do
  if [ ! -e "$js_file" ]; then
    break
  fi

  has_js=true
  if [ ! -f "$js_file.map" ]; then
    echo "Missing source map for $(basename "$js_file"): expected $(basename "$js_file").map" >&2
    missing_maps=true
  fi
done

if [ "$has_js" = false ]; then
  echo "No JavaScript bundles found in $assets_dir." >&2
  exit 1
fi

if [ "$missing_maps" = true ]; then
  exit 1
fi

rm -f "$zip_target"
(
  cd "$assets_dir"
  zip -q -r "$zip_target" . -i "*.js" "*.js.map"
)

echo "Created $zip_path"
