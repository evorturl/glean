#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
VARIABLES_ENV_FILE="${VARIABLES_ENV_FILE:-${ROOT_DIR}/env/variables.env}"
SECRETS_ENV_FILE="${SECRETS_ENV_FILE:-${ROOT_DIR}/env/secrets.env}"
QUESTION="${1:-Can I work remotely while attending a conference abroad?}"

if [[ ! -f "${VARIABLES_ENV_FILE}" ]]; then
  echo "Missing ${VARIABLES_ENV_FILE}. Restore it from git before running the demo."
  exit 1
fi

if [[ ! -f "${SECRETS_ENV_FILE}" ]]; then
  echo "Missing ${SECRETS_ENV_FILE}. Run ./scripts/setup.sh first and populate the required tokens."
  exit 1
fi

set -a
source "${VARIABLES_ENV_FILE}"
source "${SECRETS_ENV_FILE}"
set +a

if [[ -z "${GLEAN_ALLOWED_USER_EMAIL:-}" && -z "${GLEAN_CLIENT_ACT_AS:-}" ]]; then
  echo "Missing GLEAN_ALLOWED_USER_EMAIL or GLEAN_CLIENT_ACT_AS in ${SECRETS_ENV_FILE}."
  exit 1
fi

npm run ingest
npm run ask -- --question "${QUESTION}"
