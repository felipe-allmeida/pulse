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

# A hashed asset, discovered from the served document so this never pins a hash.
asset="$(curl -fsS "$BASE/" | grep -o '/assets/[^"]*\.js' | head -1)"
[ -n "$asset" ] || { echo "could not find a hashed asset in /"; exit 1; }

check "$asset"            "public, max-age=31536000, immutable"
check "/"                 "no-cache"
check "/about"            "no-cache"
check "/llms.txt"         "no-cache"
check "/sitemap.xml"      "no-cache"
check "/favicon.svg"      "public, max-age=604800"
check "/og.png"           "public, max-age=604800"

[ "$failures" -eq 0 ] || { echo "$failures check(s) failed"; exit 1; }
echo "all cache headers correct"
