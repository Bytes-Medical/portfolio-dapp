#!/usr/bin/env bash
# Builds the static SPA bundle for Capacitor (output: export → ./out).
#
# The /api route handlers are POST/dynamic and can't be statically exported —
# and they don't belong in the mobile bundle anyway (the app calls the Render
# backend over HTTPS). So we stash app/api aside for the duration of the build.
# The trap restores it even if the build fails or is interrupted.
set -euo pipefail
cd "$(dirname "$0")/.."

API="app/api"
STASH=".api-stash"

restore() { [ -d "$STASH" ] && mv "$STASH" "$API"; }
trap restore EXIT

[ -d "$API" ] && mv "$API" "$STASH"

BUILD_TARGET=static npx next build
echo "Static bundle written to ./out"
