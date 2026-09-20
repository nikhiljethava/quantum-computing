# Article 4 companion links

The durable companion route is `/series/04-qubit-technologies`. The content revision is `article4-v9`; the revision is recorded in learning exports and is not part of the route.

**Deployment status: not deployed or verified for this release.** The origin below is the app URL supplied by the owner, not a newly invented hostname. Every Article 4 URL on this page remains proposed until the approved deployment passes signed-out smoke checks. Missing reviewed MP4, GIF, step, and print assets currently prevent the complete release. Do not add these links to the published article yet.

Proposed companion URL: [Article 4 companion](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies).

## Exact lesson destinations

Each link selects a lesson and a reading level. It does not restore live controls or a saved learning record. Only the ten lesson IDs and levels `100` or `400` are accepted; missing, invalid, or duplicate values resolve to safe defaults.

| Lesson | Level 100 destination | Level 400 destination |
| --- | --- | --- |
| Sampling | [Sampling](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=sampling&level=100) | [Technical sampling](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=sampling&level=400) |
| Scheduling | [Scheduling](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=scheduling&level=100) | [Technical scheduling](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=scheduling&level=400) |
| Transmon | [Transmon](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=transmon&level=100) | [Technical transmon](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=transmon&level=400) |
| Ions | [Ions](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=ions&level=100) | [Technical ions](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=ions&level=400) |
| Routing | [Routing](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=routing&level=100) | [Technical routing](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=routing&level=400) |
| Blockade | [Blockade](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=blockade&level=100) | [Technical blockade](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=blockade&level=400) |
| Photonics | [Photonics](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=photonics&level=100) | [Technical photonics](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=photonics&level=400) |
| Loss | [Loss](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=loss&level=100) | [Technical loss](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=loss&level=400) |
| Phase | [Phase](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=phase&level=100) | [Technical phase](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=phase&level=400) |
| Entanglement | [Entanglement](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=entanglement&level=100) | [Technical entanglement](https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/series/04-qubit-technologies?lesson=entanglement&level=400) |

## Suggested article link text

- Near the reading guide: “Explore the examples in Quantum Foundry. You can replay each explanation, inspect the steps, and change a few assumptions. These are educational models, not measurements from quantum hardware.” Link to the companion route after the reviewed media is supplied and verified.
- After the sampling figure: “Try this yourself: increase the number of measurements and watch the uncertainty shrink. Then add an offset and see why a more precise answer can still be wrong.” Link to sampling at Level 100.
- After the scheduling figure: “Choose jobs A through E and see which equipment conflicts. The app checks this small example classically, so you can inspect the answer before considering a quantum mapping.” Link to scheduling at Level 100.
- After routing: “Compare the extra work. Change the number of state exchanges and inspect the operation count under the stated teaching model.” Link to routing at Level 100.
- After photonics: “Change the phase to see how the ideal detector probabilities change. Then open the separate loss lesson to count how much light reaches the detectors.” Link separately to photonics and loss at Level 100.
- At the conclusion: “Save a note of the assumptions you explored and the questions you would ask before choosing a machine. The companion helps frame an evaluation; it does not choose a winning technology for you.” Link to the companion. The learning record is available on that page; it has no separate route.

## Publication and deployment configuration

`NEXT_PUBLIC_SERIES_ARTICLE_04_URL` remains empty because the real Article 4 publication URL has not been supplied. The external article CTA is hidden for empty or invalid values, including URLs with embedded credentials. A query parameter cannot supply an article destination.

Cloud Build `_SITE_URL` now defaults to the owner-supplied app origin above, whose root returned HTTP 200 in a read-only check. Override it if deploying to another origin. This does not verify the undeployed Article 4 route. Set `_SERIES_ARTICLE_04_URL` only once the real HTTPS article publication URL is available. These are build-time values; runtime-only Cloud Run changes do not replace the compiled values. See [environment configuration](ENVIRONMENT_VARIABLES.md).

After deployment, check the returned Cloud Run URL, each lesson deep link, Back/Forward navigation, all media MIME types, intentional media loading, and external article CTA in a signed-out browser. Use the existing access script with the returned URL:

```bash
scripts/check-frontend-access.sh --url "$FRONTEND_URL" --mode public
```

Read [implementation status](ARTICLE_04_IMPLEMENTATION.md) for actual local checks, source gaps, and the release gate. A successful code push or local build is not a deployed endpoint verification.
