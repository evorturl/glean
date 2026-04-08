#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${ROOT_DIR}/env"
LEGACY_ENV_FILE="${ENV_DIR}/local.env"
SECRETS_FILE="${ENV_DIR}/secrets.env"
SECRETS_EXAMPLE_FILE="${ENV_DIR}/secrets.env.example"
VARIABLES_EXAMPLE_FILE="${ENV_DIR}/variables.env.example"
VARIABLES_FILE="${ENV_DIR}/variables.env"

mkdir -p "${ENV_DIR}"

if [[ -f "${LEGACY_ENV_FILE}" && ! -f "${SECRETS_FILE}" ]]; then
  mv "${LEGACY_ENV_FILE}" "${SECRETS_FILE}"
  echo "Renamed ${LEGACY_ENV_FILE} to ${SECRETS_FILE}."
  echo "Review ${SECRETS_FILE} and move any non-TOKEN/KEY values into ${VARIABLES_FILE} to match the current split."
fi

if [[ ! -f "${VARIABLES_FILE}" ]]; then
  cp "${VARIABLES_EXAMPLE_FILE}" "${VARIABLES_FILE}"
  echo "Created ${VARIABLES_FILE} from ${VARIABLES_EXAMPLE_FILE}. Update the non-secret runtime values if needed before running demo or API commands."
fi

if [[ ! -f "${SECRETS_FILE}" ]]; then
  cp "${SECRETS_EXAMPLE_FILE}" "${SECRETS_FILE}"
  echo "Created ${SECRETS_FILE} from ${SECRETS_EXAMPLE_FILE}. Fill in the placeholder values before running demo or API commands."
fi

npm ci
