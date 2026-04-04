#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${ROOT_DIR}/env/local.env}"
QUESTION="${1:-Can I work remotely while attending a conference abroad?}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Run ./scripts/setup.sh first and populate the required tokens."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

if [[ -z "${GLEAN_ALLOWED_USER_EMAIL:-}" && -z "${GLEAN_CLIENT_ACT_AS:-}" ]]; then
  echo "Missing GLEAN_ALLOWED_USER_EMAIL or GLEAN_CLIENT_ACT_AS in ${ENV_FILE}."
  exit 1
fi

npm run ingest
npm run ask -- --question "${QUESTION}"
