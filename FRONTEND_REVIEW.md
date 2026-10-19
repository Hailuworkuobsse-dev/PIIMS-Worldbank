# PIIMS Frontend — Code Review

**Reviewed:** 2026-10-18 · commit `29da5dc` (origin/main) · React 18 + TypeScript + Vite 5
**Scope:** `frontend/` — 346 TS/TSX files. Verified by running `npm ci`, `tsc --noEmit`, `eslint`, `vitest run`, `vite build`.

## Verdict

| Check | Result |
|---|---|
| `npm run build` | ✅ Passes — **but misleading** (see §1) |
| `npm run typecheck` | ❌ **390 errors** |
| `npm run lint` | ❌ **94 errors, 101 warnings** |
| `npm test` (vitest) | ❌ **66 of 129 tests fail** (29 of 40 files) |
| Frontend CI | ⚠️ **Never runs** — workflow is in the wrong directory (§7) |

**Root cause:** an automated "organizer" script was run on 2026-10-17 (`organize-log.txt`, commits *"fixed"*, *"xnxx"*, *"gg"*). It moved files into `src/features/*` but on every conflict it **kept the old file as canonical and stranded the new one with a `-2` suffix**. The live app therefore runs on stale v1 wiring while ~340 feature files (and their tests) were written against the orphaned v2 code.

---

## 1. The deployed app is an empty shell (Critical)

`src/App.tsx` → `src/app/router.tsx` is a **4-route skeleton** (Login, Dashboard, NotFound) containing the comment *"Feature routes added in Steps 5–9"*. That's why `vite build` succeeds and emits only ~257 KB with 3 page chunks — none of the procurement/results/financial/impact/etc. code is even compiled.

Four generations of wiring exist; the **oldest** is the one that's live:

| File | Lines | Status |
|---|---|---|
| `src/app/router.tsx` | 19 | 🔴 **live** — skeleton, 4 routes |
| `src/app/router-2.tsx` | 320 | orphaned — full ~24-route app (but has stale import paths, see §2) |
| `src/app/router-4.tsx` | 58 | orphaned — AppShell-nested variant, imports **nonexistent** `@/pages/AppShellRoute` |
| `src/app/router-3.tsx` | 14 | orphaned — actually an `App.tsx` variant (AppBootstrap + RoleSwitcher), misnamed |

Same story for the entry points:
- `main.tsx` (live) lacks the `ErrorBoundary` and `registerServiceWorker()` helper that `main-2.tsx` has.
- `providers.tsx` (live) lacks `ToastProvider`, `UpdatePrompt`, `GlobalLoadingBar` that `providers-2.tsx` adds.

**The build passing is an illusion:** `tsconfig.build.json` only includes `src/main.tsx`, so `tsc` follows just the skeleton's import graph. Every broken feature file is invisible to the build.

## 2. Even the "full" router (`router-2.tsx`) won't compile

The organizer moved pages into feature dirs but the router still points at old locations — **9 broken lazy imports**:

| Router import | Reality |
|---|---|
| `@/features/impact/ImpactDashboardPage` | exists at `@/features/analytics/ImpactDashboardPage` |
| `@/features/impact/ImpactIndicatorsPage` | exists at `@/features/impact-indicators/…` |
| `@/features/impact/SurveyBuilderPage` | exists at `@/features/survey/…` |
| `@/features/impact/FieldOpsPage` | exists at `@/features/field/…` |
| `@/features/impact/QAPage` | exists at `@/features/qa/…` |
| `@/features/impact/WarehousePage` | exists at `@/features/warehouse/…` |
| `@/features/beneficiaries/BeneficiaryPage` | **doesn't exist** — closest is `BeneficiaryListPage` |
| `@/features/research/ResearchCataloguePage` | exists but misplaced at `@/features/warehouse/ResearchCataloguePage` |
| `@/features/research/ResearchRequestsPage` | **doesn't exist anywhere** |

## 3. Stores: components are written against v2, but v1 is what's imported (Critical)

- **UI store** — `AppShell`, `TopBar`, `SideNav`, `MobileNav`, `GlobalSearch`, `KeyboardHelp` all use `setSearchOpen`, `searchOpen`, `mobileNavOpen`, `setMobileNavOpen`, `toggleSidebar`, `setKeyboardHelpOpen` — **none exist** in the live `src/stores/ui.store.ts`. They all exist in the orphaned `ui.store-2.ts`. → ~12 TS2339 errors; the layout crashes at runtime the moment it's wired in.
- **Auth store** — `LoginPage`, `guards.tsx`, `UserMenu`, `RoleSwitcher` and `auth.store.test.ts` expect `login(req) → { mfaRequired, mfaToken }`, `completeMFA()`, and `AuthUser.email/orgName/scope`. The live `auth.store.ts` has `login(username, password, mfa?) → Promise<void>` and an `AuthUser` without those fields. The matching implementation sits orphaned in `auth.store-2.ts` (which itself has unused imports + `exactOptionalPropertyTypes` violations).

## 4. Missing npm dependencies (88 × TS2307 "Cannot find module")

Imported in source, absent from `package.json`:

| Package | Used by |
|---|---|
| `@hookform/resolvers/zod` | **29 files** — every zod-validated form |
| `date-fns` | `src/lib/utils/date.ts` |
| `leaflet`, `react-leaflet` (+ `@types/leaflet`) | `features/geo/MapPage`, `LocationPicker` |
| `@sentry/react` | `lib/monitoring/sentry.ts` (dynamic import; needs dep or ambient declaration) |
| `@axe-core/playwright` | `tests/e2e/a11y.spec.ts` |

## 5. Test infrastructure is not configured at all

There is **no vitest config**: `vite.config.ts` has no `test` block and no `vitest.config.ts` exists — yet `tsconfig.json` declares `vitest/globals` types and `jsdom` + `@testing-library/jest-dom` are installed. Consequences:

1. All component tests run in a **node environment** → `ReferenceError: document is not defined` (this alone kills Toast, Tabs, Select, Modal, Input, Button, DataGrid, guards, etc.).
2. No setup file → `toBeInTheDocument`/`toHaveClass` matchers unregistered.
3. **Playwright e2e specs (`tests/e2e/*.spec.ts`) get collected into the unit run** and fail on `@playwright/test`/axe imports.
4. `globals: true` not enabled → `describe/it/expect` only work via explicit import.

After fixing config, one **genuine logic bug** remains: `features/warehouse/anonymize.ts` — at level L2, `suppressKAnon` runs over `[ageBand, region, zone]` with the default `suppressionThreshold` and **drops the entire test sample**, so `anonymize()` returns `[]` (2 failing tests: *"L2 brackets age…"*, *"L2 top-codes income…"*). Either the default threshold is wrong for small datasets or the tests' config must lower it — as written, L2 anonymization silently deletes everything.

## 6. i18n exists in three broken generations

- **Live:** `lib/i18n/index.ts` loads monolithic `en.json` (**1.2 KB**) + `am.json` (1.6 KB) as a single `common` namespace — nearly every string key used by the 340-file app is missing → UI would render raw keys.
- **New scheme:** `lib/i18n/en/index.ts` imports 17 namespace JSONs; only `common.json` + `projects.json` exist → 15 × TS2307.
- **Stranded fragments:** `en-2.json`…`en-7.json` contain most missing namespaces (note `en-2` and `en-3` **both** hold `projects` — pick one), but `auth`, `admin`, `analytics`, `reports` namespaces exist nowhere. `am/` contains only `index.ts`. `index-2.ts` has duplicate object keys (TS1117).

## 7. CI/CD

- `frontend/.github/workflows/ci.yml` and `deploy.yml` **never execute** — GitHub Actions only reads `<repo-root>/.github/workflows/`. The root workflow dir contains only `backend-verification.yml`. Even if relocated, `ci.yml` triggers on push to `develop` and PRs to `main/develop` — pushes to `main` (the only branch that exists) wouldn't run it.
- `tsconfig.build.json` gating the build on `main.tsx` only = the type-check gate can never catch feature breakage. Once §1–4 are fixed, `include` should be `src` + configs.
- `package.json` `"prepare": "husky install"` — deprecated in husky 9 and fails on `npm ci` (`".git can't be found"` — `.git` is at repo root, not in `frontend/`). Move husky to the monorepo root or drop it.

## 8. TypeScript config vs. codebase (146 errors from one flag)

`"exactOptionalPropertyTypes": true` produces **119 × TS2375 + 27 × TS2379** across ~40 files (the code passes `prop={maybeUndefined}` into optional props everywhere). The codebase was not written for this flag. Recommend removing it (or keeping it and doing a deliberate fix pass — it's not a small job).
Also: **62 unused-var errors** (TS6133/6192/6196, `noUnusedLocals`), `ErrorBoundary.tsx` missing `override` modifiers (TS4114 ×3, `noImplicitOverride`), `field/CapiRenderer.tsx` imports `Question` which `field.types.ts` doesn't export (TS2459) + implicit `any` callbacks in geo/field files.

## 9. Repo hygiene / junk to delete

Stranded duplicates (resolve, don't keep both): `main-2.tsx`, `providers-2.tsx`, `router-2/3/4.tsx`, `AppShell-2.tsx`, `menu.config-2/-3.ts`, `ui.store-2.ts`, `auth.store-2.ts`, `sentry-2.ts`, `ProjectListPage-2.tsx`, `en-2..7.json`, `en/index-2.ts`, `am.json`/`am-2.json` (frontend root), `README-2.md`, `vite.config-2.ts` (differs from live config — check before deleting), `scripts/split-i18n-2.ts`, `deploy.yml` stub.
Broken/empty files: `frontend/WarehousePage.tsx` (5-line fragment with **top-level JSX** — not valid TS), `src/components/ui/QAPage.tsx` (**0 bytes**, duplicate of the 350-line `features/qa/QAPage.tsx`), `src/pages/DesignSystemPage-2.tsx` (truncated — references `Route`/`DesignSystemPage` without imports; also `DesignSystemPage.tsx` misses required `onFiles` prop).
Repo root: `codes.md` — a **1 MB / 31k-line AI build log**; `_EXTRACTION_MANIFEST.json` (56 KB), `organize-log.txt` — process artifacts, not source. No hardcoded secrets were found in `src/` (checked).

---

## Recommended fix order

1. **Pick the canonical generation and delete the rest** — adopt `-2` versions of `main`, `providers`, `ui.store`, `auth.store`; choose `router-2` (fixing its 9 paths; create/remove `ResearchRequestsPage`, `BeneficiaryPage`→`BeneficiaryListPage`, move `ResearchCataloguePage` to `features/research/`). Delete `router-3/-4`, stub `WarehousePage.tsx`, empty `QAPage.tsx`, `DesignSystemPage-2.tsx`.
2. **Install missing deps:** `@hookform/resolvers date-fns leaflet react-leaflet @sentry/react` + dev `@types/leaflet @axe-core/playwright`.
3. **Add `vitest.config.ts`:** `environment: "jsdom"`, `globals: true`, `setupFiles` (jest-dom), `include: ["src/**/*.test.*"]` (exclude `tests/e2e`), `@` alias.
4. **Rebuild i18n:** distribute `en-2..7.json` fragments into `en/<namespace>.json`, resolve the `projects` duplicate, author the 4 missing namespaces, mirror for `am/`, switch `index.ts` to namespace resources.
5. **Relax tsconfig:** drop `exactOptionalPropertyTypes`; fix the ~62 unused-var and remaining ~40 real mismatch errors.
6. **Fix `anonymize` suppression default** (or the tests) so L2 doesn't empty small datasets.
7. **Move CI to repo root** (`.github/workflows/frontend-ci.yml` with `defaults.run.working-directory: frontend`), trigger on `main`, and make `tsconfig.build.json` cover all of `src` so the build gate is real.
8. **Sweep junk** (§9) and the 1 MB `codes.md` out of the repo.

Steps 1–3 alone will get the app actually rendering its features and cut the error counts by roughly ⅔.
