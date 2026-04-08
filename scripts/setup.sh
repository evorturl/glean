#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${ROOT_DIR}/env"
LEGACY_ENV_FILE="${ENV_DIR}/local.env"
SECRETS_FILE="${ENV_DIR}/secrets.env"
SECRETS_EXAMPLE_FILE="${ENV_DIR}/secrets.env.example"
VARIABLES_FILE="${ENV_DIR}/variables.env"

mkdir -p "${ENV_DIR}"

if [[ ! -f "${VARIABLES_FILE}" ]]; then
  echo "Missing ${VARIABLES_FILE}. Restore it from git before running setup."
  exit 1
fi

if [[ ! -f "${SECRETS_FILE}" ]]; then
  if [[ -f "${LEGACY_ENV_FILE}" ]]; then
    cp "${LEGACY_ENV_FILE}" "${SECRETS_FILE}"
    echo "Copied existing ${LEGACY_ENV_FILE} to ${SECRETS_FILE}."
  else
    cp "${SECRETS_EXAMPLE_FILE}" "${SECRETS_FILE}"
    echo "Created ${SECRETS_FILE} from ${SECRETS_EXAMPLE_FILE}. Fill in the placeholder values before running demo or API commands."
  fi
fi

npm ci
