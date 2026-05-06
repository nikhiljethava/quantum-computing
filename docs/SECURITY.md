# Security

Quantum Foundry is an independent personal project and is not an official Google product.

Quantum Foundry is licensed under Apache-2.0. See the root [LICENSE](../LICENSE) file.

## Posture

This is a personal educational project and is not independently security-reviewed.

## Secrets

- Do not commit secrets.
- Use Secret Manager or deployment-time secret injection.
- Keep user-supplied Gemini keys client/session scoped unless an explicit secure storage design is added.

## Service Accounts

Use least privilege for Cloud Run, Cloud SQL, Cloud Storage, Cloud Tasks, and Artifact Registry.

## User Data

The app stores project/session/job/artifact metadata. Treat artifacts as potentially sensitive if users upload or generate proprietary content.

## Guide and Prompt Handling

The local guide is deterministic. Vertex AI/Gemini mode should disclose data flow and avoid persisting user questions unless analytics is explicitly designed.

## Responsible Disclosure

Contact: TODO. Add a preferred maintainer contact before broad public reuse.
