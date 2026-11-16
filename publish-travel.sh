#!/bin/bash
# Publishes app/www to https://clapyourhouse.github.io/door/travel/
# Adds ONLY a travel/ folder on top of origin/gh-pages. The root site (index.html, door.html),
# your local branches and your uncommitted work are not touched.
set -euo pipefail
cd "$(dirname "$0")"

echo "Fetching origin/gh-pages..."
git fetch origin gh-pages

TMP="$(mktemp -d)"
cleanup() { git worktree remove --force "$TMP/pages" >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

git worktree add --detach "$TMP/pages" origin/gh-pages >/dev/null
mkdir -p "$TMP/pages/travel"
cp app/www/app.js app/www/config.js app/www/style.css app/www/legal.css app/www/legal.js "$TMP/pages/travel/"
cp app/www/privacy.html app/www/terms.html app/www/tokusho.html "$TMP/pages/travel/"
cp app/www/og.png app/www/logo.svg app/www/favicon.png app/www/icon-192.png app/www/apple-touch-icon.png "$TMP/pages/travel/"
# unlisted for now: ask search engines not to index
sed 's#<head>#<head>\n<meta name="robots" content="noindex">#' app/www/index.html > "$TMP/pages/travel/index.html"
# cache busting: a new version number on every publish, so browsers never keep an old app.js / config.js
VER="$(date +%Y%m%d%H%M%S)"
sed -i.bak "s#src=\"config.js\"#src=\"config.js?v=$VER\"#; s#src=\"app.js\"#src=\"app.js?v=$VER\"#" "$TMP/pages/travel/index.html"
rm -f "$TMP/pages/travel/index.html.bak"
for f in privacy terms tokusho; do
  sed -i.bak "s#href=\"legal.css\"#href=\"legal.css?v=$VER\"#; s#src=\"legal.js\"#src=\"legal.js?v=$VER\"#" "$TMP/pages/travel/$f.html"
  rm -f "$TMP/pages/travel/$f.html.bak"
done

cd "$TMP/pages"
git add travel
echo
echo "=== Files that will be published (must all be under travel/) ==="
git diff --cached --stat
if git diff --cached --name-only | grep -v '^travel/' | grep -q .; then
  echo "ABORT: something outside travel/ changed."; exit 1
fi
echo
if grep -l "要記入" travel/privacy.html travel/terms.html travel/tokusho.html >/dev/null 2>&1; then
  echo "WARNING: legal pages still contain items marked 要記入 (name in kanji / address / phone)."
  echo "         Fine for your own testing, but fill them in before sharing the URL with anyone."
fi
read -r -p "Push to gh-pages now? [y/N] " ans
[ "$ans" = "y" ] || { echo "Cancelled. Nothing was pushed."; exit 0; }

git commit -q -m "Publish Door Travel web preview under /travel

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LrTc7Z3tnaE2P98qswfeUf"
git push origin HEAD:gh-pages
echo
echo "Done. Open in ~1-2 minutes: https://clapyourhouse.github.io/door/travel/"
