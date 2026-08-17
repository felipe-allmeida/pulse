#!/usr/bin/env bash
# Asserts the Cache-Control matrix from the SEO design spec, section 1.4,
# against a running pulse-web container. Run: deploy/cache-headers.test.sh
set -euo pipefail

BASE="${1:-http://localhost:8080}"
failures=0

check() {
  local path="$1" expected="$2"
  local actual
  actual="$(curl -fsSI "$BASE$path" | tr -d '\r' \
    | awk -F': ' 'tolower($1)=="cache-control" {print $2}')"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL $path"
    echo "  expected: $expected"
    echo "  actual:   ${actual:-<none>}"
    failures=$((failures + 1))
  else
    echo "ok   $path"
  fi
}

# A missing file must genuinely 404 rather than fall through to the SPA.
# Without its own `handle` block (no try_files), /assets/<gone>.js answered 200
# with index.html *and* a year of `immutable` — so a chunk that vanished across
# a deploy got HTML pinned under a .js URL for a year.
#
# No `-f` here, unlike check() above: `curl -f` exits non-zero on a 4xx and
# under `set -e` that would kill the script instead of reporting the status,
# which is the one thing this function exists to read.
check_status() {
  local path="$1" expected="$2"
  local actual
  actual="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$path")"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL $path"
    echo "  expected status: $expected"
    echo "  actual status:   ${actual:-<none>}"
    failures=$((failures + 1))
  else
    echo "ok   $path -> $actual"
  fi
}

# What a request actually got back. A fallback to the SPA is invisible in the
# status alone once it 404s correctly, but a content-type of text/html under a
# .js or .webp URL is the fingerprint of it, so assert that too.
check_type() {
  local path="$1" expected="$2"
  local actual
  actual="$(curl -fsSI "$BASE$path" | tr -d '\r' \
    | awk -F': ' 'tolower($1)=="content-type" {print $2}')"
  case "$actual" in
    "$expected"*)
      echo "ok   $path ($actual)" ;;
    *)
      echo "FAIL $path"
      echo "  expected content-type: $expected*"
      echo "  actual content-type:   ${actual:-<none>}"
      failures=$((failures + 1)) ;;
  esac
}

# A hashed asset, discovered from the served document so this never pins a hash.
asset="$(curl -fsS "$BASE/" | grep -o '/assets/[^"]*\.js' | head -1)"
[ -n "$asset" ] || { echo "could not find a hashed asset in /"; exit 1; }

# Likewise a real screenshot, discovered from the projects document — this
# bucket has its own rewritten window and nothing checked it before.
shot="$(curl -fsS "$BASE/projects" | grep -o '/screenshots/[^"]*\.webp' | head -1)"
[ -n "$shot" ] || { echo "could not find a screenshot in /projects"; exit 1; }

check "$asset"            "public, max-age=31536000, immutable"
check "$shot"             "public, max-age=604800"
check "/"                 "no-cache"
check "/about"            "no-cache"
check "/llms.txt"         "no-cache"
check "/sitemap.xml"      "no-cache"
check "/favicon.svg"      "public, max-age=604800"
check "/og.png"           "public, max-age=604800"

# The document routes must still resolve to their own generated documents, not
# to the SPA shell: /projects has a sibling directory of the same name, and the
# `{path}.html`-first ordering in try_files is the only thing that stops it
# 404ing. Cheap insurance against a future reorder of that line.
check_type "/projects"    "text/html"
check_status "/projects"  "200"

# The regression guards for the fallback bug. Missing files under these two
# prefixes must 404, not come back as index.html with a long cache on it, and
# the real screenshot above must still be served as an image.
check_status "/assets/does-not-exist-deadbeef.js" "404"
check_status "/screenshots/does-not-exist.webp"   "404"
check_type   "$shot"                              "image/webp"
check_type   "$asset"                             "text/javascript"

# And the 404 itself must not be cacheable: an immutable year on a missing
# hashed chunk poisons the URL for a rollback exactly like the 200 did.
for missing in /assets/does-not-exist-deadbeef.js /screenshots/does-not-exist.webp; do
  cc="$(curl -sSI "$BASE$missing" | tr -d '\r' \
    | awk -F': ' 'tolower($1)=="cache-control" {print $2}')"
  if [ "$cc" != "no-store" ]; then
    echo "FAIL $missing (404 cache-control)"
    echo "  expected: no-store"
    echo "  actual:   ${cc:-<none>}"
    failures=$((failures + 1))
  else
    echo "ok   $missing 404 is no-store"
  fi
done

[ "$failures" -eq 0 ] || { echo "$failures check(s) failed"; exit 1; }
echo "all cache headers correct"
