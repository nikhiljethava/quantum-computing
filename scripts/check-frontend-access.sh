#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/check-frontend-access.sh --url URL --mode public|iap-protected

Options:
  --headers-file PATH   Read a saved curl -sSI header response instead of calling URL.
  --route PATH          Public route to check. Repeat to override the default route set.

The check does not follow redirects. Public mode fails on Cloud Run IAP
intercepts, Google OAuth redirects, auth-related 401/403 responses,
unexpected 404 responses, and 5xx responses.
IAP-protected mode passes when unauthenticated curl sees an IAP response.
USAGE
}

url=""
mode=""
headers_file=""
routes=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      url="${2:-}"
      shift 2
      ;;
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    --headers-file)
      headers_file="${2:-}"
      shift 2
      ;;
    --route)
      routes+=("${2:-}")
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "${mode}" ]]; then
  echo "--mode is required." >&2
  usage >&2
  exit 2
fi

if [[ "${mode}" != "public" && "${mode}" != "iap-protected" ]]; then
  echo "Invalid frontend access mode: ${mode}. Use public or iap-protected." >&2
  exit 2
fi

default_public_routes=(
  "/"
  "/learn"
  "/learn/quantum-software-stack"
  "/series"
  "/series/01-platform-problem"
  "/series/02-hybrid-computing"
  "/assess"
  "/build"
  "/map"
)

read_headers() {
  local target="$1"
  curl -sSI --max-time 20 "${target}" || true
}

header_status() {
  printf '%s\n' "$1" | awk 'toupper($1) ~ /^HTTP/ {print $2; exit}'
}

has_iap_intercept() {
  local lower_headers
  lower_headers="$(printf '%s\n' "$1" | tr '[:upper:]' '[:lower:]')"
  printf '%s\n' "${lower_headers}" | grep -q '^x-goog-iap-generated-response:[[:space:]]*true' ||
    printf '%s\n' "${lower_headers}" | grep -q '^location:.*accounts\.google\.com/.*/oauth'
}

validate_public_response() {
  local headers="$1"
  local label="$2"
  local status
  status="$(header_status "${headers}")"

  if has_iap_intercept "${headers}"; then
    cat >&2 <<EOF
Cloud Run IAP is intercepting this URL (${label}). Disable IAP:
  gcloud run services update quantum-foundry-frontend --project cloudhub-apptopology-golden --region us-central1 --no-iap
Then enable public invocation using --no-invoker-iam-check, or fall back to allUsers roles/run.invoker if required.
EOF
    return 1
  fi

  if [[ "${status}" == "401" || "${status}" == "403" ]]; then
    cat >&2 <<EOF
The frontend returned an authentication-related 401/403 in public mode for ${label}.
Enable public Cloud Run invocation:
  gcloud run services update quantum-foundry-frontend --project cloudhub-apptopology-golden --region us-central1 --no-invoker-iam-check
Fallback:
  gcloud run services add-iam-policy-binding quantum-foundry-frontend --project cloudhub-apptopology-golden --region us-central1 --member=allUsers --role=roles/run.invoker
EOF
    return 1
  fi

  if [[ -z "${headers}" || -z "${status}" ]]; then
    echo "Unable to read a valid HTTP response from ${label}." >&2
    return 1
  fi

  if [[ "${status}" == "404" || "${status}" =~ ^5[0-9][0-9]$ ]]; then
    echo "The public frontend route ${label} returned unexpected HTTP ${status}." >&2
    return 1
  fi
}

if [[ "${mode}" == "public" ]]; then
  if [[ -n "${headers_file}" ]]; then
    validate_public_response "$(cat "${headers_file}")" "${headers_file}"
    echo "PASS: public frontend access is not intercepted by Cloud Run IAP."
    exit 0
  fi

  if [[ -z "${url}" ]]; then
    echo "--url is required unless --headers-file is supplied." >&2
    usage >&2
    exit 2
  fi

  if [[ ${#routes[@]} -eq 0 ]]; then
    routes=("${default_public_routes[@]}")
  fi

  base_url="${url%/}"
  for route in "${routes[@]}"; do
    if [[ -z "${route}" || "${route}" != /* ]]; then
      echo "Each --route must begin with '/': ${route}" >&2
      exit 2
    fi
    target="${base_url}${route}"
    validate_public_response "$(read_headers "${target}")" "${target}"
  done

  echo "PASS: public frontend access and ${#routes[@]} required routes are healthy."
  exit 0
fi

if [[ -n "${headers_file}" ]]; then
  headers="$(cat "${headers_file}")"
elif [[ -n "${url}" ]]; then
  headers="$(read_headers "${url}")"
else
  echo "--url is required unless --headers-file is supplied." >&2
  usage >&2
  exit 2
fi

if has_iap_intercept "${headers}"; then
  echo "PASS: iap-protected frontend access is intercepted by Cloud Run IAP for unauthenticated curl."
  exit 0
fi

cat >&2 <<'EOF'
Expected an IAP-generated response in iap-protected mode, but unauthenticated curl did not see one.
Verify:
  gcloud run services update quantum-foundry-frontend --project cloudhub-apptopology-golden --region us-central1 --iap
  gcloud iap web add-iam-policy-binding --project cloudhub-apptopology-golden --region us-central1 --resource-type=cloud-run --service=quantum-foundry-frontend --member="user:USER_EMAIL" --role=roles/iap.httpsResourceAccessor
EOF
exit 1
