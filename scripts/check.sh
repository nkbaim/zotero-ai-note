#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

node - <<'NODE'
const fs = require("node:fs");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const updates = JSON.parse(fs.readFileSync("updates.json", "utf8"));
if (manifest.manifest_version !== 2) throw new Error("manifest_version must be 2");
if (!manifest.applications?.zotero?.id) throw new Error("Zotero add-on ID is missing");
if (!manifest.applications.zotero.update_url) throw new Error("Zotero update_url is missing");
const latest = updates.addons?.[manifest.applications.zotero.id]?.updates?.[0];
if (!latest) throw new Error("Update manifest entry is missing");
if (latest.version !== manifest.version) throw new Error("Manifest and update versions differ");
NODE

node --check bootstrap.js
node --check content/zotero-ai-note.js
node --check content/preferences.js
python3 -c 'import xml.etree.ElementTree as ET; ET.parse("content/preferences.xhtml")'
node tests/format.test.js

required_files=(
  bootstrap.js
  manifest.json
  updates.json
  prefs.js
  icon.svg
  content/zotero-ai-note.js
  content/preferences.js
  content/preferences.xhtml
)

for file in "${required_files[@]}"; do
  test -s "$file"
done

if rg -n 'sk-[A-Za-z0-9]{12,}' . --glob '!dist/**'; then
  echo "Possible hard-coded API key found" >&2
  exit 1
fi

echo "Checks passed."
