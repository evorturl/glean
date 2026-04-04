#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

rm -rf "${ROOT_DIR}/dist"
echo "Removed local build output from ${ROOT_DIR}/dist."
echo "No remote cleanup step is required because fixture ingest updates stable document IDs in place."
