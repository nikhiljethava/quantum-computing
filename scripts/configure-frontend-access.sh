#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/configure-frontend-access.sh \
    --project PROJECT_ID \
    --region REGION \
    --service FRONTEND_SERVICE \
    --mode public|iap-protected \
    [--iap-allowed-members user:a@example.com,group:team@example.com]

Configures Cloud Run frontend access explicitly. Public mode disables direct Cloud
Run IAP and enables unauthenticated invocation. IAP-protected mode enables IAP,
grants the IAP service agent Cloud Run invocation, and grants configured IAP
principals roles/iap.httpsResourceAccessor.
USAGE
}

project_id=""
region=""
service=""
mode=""
iap_allowed_members="${IAP_ALLOWED_MEMBERS:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      project_id="${2:-}"
      shift 2
      ;;
    --region)
      region="${2:-}"
      shift 2
      ;;
    --service)
      service="${2:-}"
      shift 2
      ;;
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    --iap-allowed-members)
      iap_allowed_members="${2:-}"
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

if [[ -z "${project_id}" || -z "${region}" || -z "${service}" || -z "${mode}" ]]; then
  echo "--project, --region, --service, and --mode are required." >&2
  usage >&2
  exit 2
fi

if [[ "${mode}" != "public" && "${mode}" != "iap-protected" ]]; then
  echo "Invalid frontend access mode: ${mode}. Use public or iap-protected." >&2
  exit 2
fi

require_gcloud_flag() {
  local flag="$1"
  if ! gcloud run services update --help 2>/dev/null | grep -q -- "${flag}"; then
    cat >&2 <<EOF
The installed gcloud SDK does not support ${flag}.
Update gcloud before deploying this access mode:
  gcloud components update
EOF
    exit 1
  fi
}

if [[ "${mode}" == "public" ]]; then
  require_gcloud_flag "--no-iap"

  echo "Configuring ${service} for public Cloud Run access."
  gcloud run services update "${service}" \
    --project="${project_id}" \
    --region="${region}" \
    --no-iap

  if gcloud run services update --help 2>/dev/null | grep -q -- "--no-invoker-iam-check"; then
    gcloud run services update "${service}" \
      --project="${project_id}" \
      --region="${region}" \
      --no-invoker-iam-check
  else
    echo "gcloud lacks --no-invoker-iam-check; falling back to allUsers roles/run.invoker." >&2
    gcloud run services add-iam-policy-binding "${service}" \
      --project="${project_id}" \
      --region="${region}" \
      --member="allUsers" \
      --role="roles/run.invoker"
  fi

  echo "Public frontend access configured."
  exit 0
fi

require_gcloud_flag "--iap"

echo "Configuring ${service} for IAP-protected Cloud Run access."
gcloud run services update "${service}" \
  --project="${project_id}" \
  --region="${region}" \
  --iap

if gcloud run services update --help 2>/dev/null | grep -q -- "--invoker-iam-check"; then
  gcloud run services update "${service}" \
    --project="${project_id}" \
    --region="${region}" \
    --invoker-iam-check
else
  gcloud run services remove-iam-policy-binding "${service}" \
    --project="${project_id}" \
    --region="${region}" \
    --member="allUsers" \
    --role="roles/run.invoker" >/dev/null 2>&1 || true
fi

project_number="$(gcloud projects describe "${project_id}" --format="value(projectNumber)")"
iap_service_agent="serviceAccount:service-${project_number}@gcp-sa-iap.iam.gserviceaccount.com"

gcloud run services add-iam-policy-binding "${service}" \
  --project="${project_id}" \
  --region="${region}" \
  --member="${iap_service_agent}" \
  --role="roles/run.invoker"

if [[ -z "${iap_allowed_members}" ]]; then
  cat >&2 <<EOF
IAP is enabled, but no IAP_ALLOWED_MEMBERS were supplied.
Grant users or groups with:
  gcloud iap web add-iam-policy-binding --project "${project_id}" --region "${region}" --resource-type=cloud-run --service="${service}" --member="user:USER_EMAIL" --role="roles/iap.httpsResourceAccessor"
EOF
else
  IFS=',' read -r -a members <<< "${iap_allowed_members}"
  for member in "${members[@]}"; do
    member="$(printf '%s' "${member}" | xargs)"
    [[ -n "${member}" ]] || continue
    gcloud iap web add-iam-policy-binding \
      --project="${project_id}" \
      --region="${region}" \
      --resource-type=cloud-run \
      --service="${service}" \
      --member="${member}" \
      --role="roles/iap.httpsResourceAccessor"
  done
fi

echo "IAP-protected frontend access configured."
