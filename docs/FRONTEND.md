# Frontend

Quantum Foundry is an independent personal project and is not an official Google product.

## Structure

- `apps/frontend/src/app`: Next.js App Router routes.
- `apps/frontend/src/components`: shared UI, layout, guide, workspace, and notices.
- `apps/frontend/src/content`: static lessons and public use-case pages.
- `apps/frontend/src/lib`: API client, hooks, local progress helpers.
- `apps/frontend/src/types`: typed API contracts.

## Public Routes

- `/`
- `/about`
- `/learn`
- `/learn/[path]`
- `/learn/[path]/[slug]`
- `/explore`
- `/assess`
- `/build`
- `/map`
- `/use-cases/[slug]`

## Shared Components

- `IndependentProjectNotice`: global app disclaimer.
- `Footer`: trademark and descriptive-reference disclaimer.
- `HardwareAccessNote`: exact hardware-access disclaimer.
- `GuidePanel`: context-aware guide UI.
- `components/ui/*`: neutral reusable UI primitives.

## SEO

Metadata is defined for major public routes. `sitemap.ts` and `robots.ts` publish educational routes and avoid promoting private workspace routes.

## Limitations

- Learning progress is localStorage-only.
- No dedicated frontend unit-test framework is configured.
- Manual visual QA is still important for the Build workspace.
