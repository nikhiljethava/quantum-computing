#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/check-frontend-access.sh --url URL --mode public|iap-protected

Options:
  --headers-file PATH   Read a saved curl -sSI header response instead of calling URL.

The check does not follow redirects. Public mode fails on Cloud Run IAP
intercepts, Google OAuth redirects, and auth-related 401/403 responses.
IAP-protected mode passes when unauthenticated curl sees an IAP response.
USAGE
}

url=""
mode=""
headers_file=""

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

if [[ -n "${headers_file}" ]]; then
  headers="$(cat "${headers_file}")"
elif [[ -n "${url}" ]]; then
  headers="$(curl -sSI --max-time 20 "${url}" || true)"
else
  echo "--url is required unless --headers-file is supplied." >&2
  usage >&2
  exit 2
fi

lower_headers="$(printf '%s\n' "${headers}" | tr '[:upper:]' '[:lower:]')"
status="$(printf '%s\n' "${headers}" | awk 'toupper($1) ~ /^HTTP/ {print $2; exit}')"

has_iap_header=false
has_google_oauth_redirect=false
has_auth_status=false

if printf '%s\n' "${lower_headers}" | grep -q '^x-goog-iap-generated-response:[[:space:]]*true'; then
  has_iap_header=true
fi

if printf '%s\n' "${lower_headers}" | grep -q '^location:.*accounts\.google\.com/.*/oauth'; then
  has_google_oauth_redirect=true
fi

if [[ "${status}" == "401" || "${status}" == "403" ]]; then
  has_auth_status=true
fi

if [[ "${mode}" == "public" ]]; then
  if [[ "${has_iap_header}" == true || "${has_google_oauth_redirect}" == true ]]; then
    cat >&2 <<'EOF'
Cloud Run IAP is intercepting this URL. Disable IAP:
  gcloud run services update quantum-foundry-frontend --project cloudhub-apptopology-golden --region us-central1 --no-iap
Then enable public invocation using --no-invoker-iam-check, or fall back to allUsers roles/run.invoker if required.
EOF
    exit 1
  fi

  if [[ "${has_auth_status}" == true ]]; then
    cat >&2 <<'EOF'
The frontend returned an authentication-related 401/403 in public mode.
Enable public Cloud Run invocation:
  gcloud run services update quantum-foundry-frontend --project cloudhub-apptopology-golden --region us-central1 --no-invoker-iam-check
Fallback:
  gcloud run services add-iam-policy-binding quantum-foundry-frontend --project cloudhub-apptopology-golden --region us-central1 --member=allUsers --role=roles/run.invoker
EOF
    exit 1
  fi

  if [[ -z "${headers}" || -z "${status}" ]]; then
    echo "Unable to read a valid HTTP response from ${url:-headers file}." >&2
    exit 1
  fi

  echo "PASS: public frontend access is not intercepted by Cloud Run IAP."
  exit 0
fi

if [[ "${has_iap_header}" == true || "${has_google_oauth_redirect}" == true ]]; then
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
