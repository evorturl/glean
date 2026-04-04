#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${ROOT_DIR}/env"
ENV_FILE="${ENV_DIR}/local.env"
EXAMPLE_FILE="${ENV_DIR}/local.env.example"

mkdir -p "${ENV_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${EXAMPLE_FILE}" "${ENV_FILE}"
  echo "Created ${ENV_FILE} from ${EXAMPLE_FILE}. Fill in the placeholder values before running demo or API commands."
fi

npm ci
