<!--
SYNC IMPACT REPORT
==================
Version change: N/A (initial) → 1.0.0
Added sections:
  - I. Code Quality & Type Safety
  - II. Test-First Development
  - III. User Experience Consistency
  - IV. Performance Requirements
  - V. Build Pipeline Integrity
  - Quality Gates
  - Development Workflow
  - Governance
Templates updated:
  - .specify/templates/plan-template.md ✅ (Constitution Check section aligns)
  - .specify/templates/spec-template.md ✅ (Success Criteria aligns with SC metrics)
  - .specify/templates/tasks-template.md ✅ (Phase structure includes typecheck + build gates)
Deferred items: None
-->

# Slot RPG Constitution

## Core Principles

### I. Code Quality & Type Safety

All code MUST pass TypeScript strict-mode type checking (or JSDoc type annotations if plain JS)
before any pull request is merged. No `any` casts without an explicit inline comment
explaining why the escape is necessary.

- Linting (ESLint) MUST pass with zero errors; warnings are permitted but MUST be reviewed.
- Dead code, unused imports, and commented-out blocks MUST be removed before merge.
- Complexity: functions exceeding 40 lines or cyclomatic complexity > 10 MUST be refactored
  or carry a documented justification in the PR description.

**Rationale**: GitHub Pages deploys directly from the built artifact. A type error that
reaches CI breaks the deploy pipeline with no rollback — catching it locally is cheaper.

### II. Test-First Development (NON-NEGOTIABLE)

Tests MUST be written and confirmed to fail (Red) before implementation begins (Green),
followed by refactor. This Red-Green-Refactor cycle is mandatory for all non-trivial logic.

- Unit tests MUST cover: reel spin logic, currency accumulation, win-condition evaluation,
  market transaction validation.
- Integration tests MUST cover: full spin → currency update → UI re-render flow.
- A feature is not "done" until all tests pass and coverage for new code is ≥ 80%.
- No test stubs, no `it.skip`, no `xit` left in the codebase at merge time.

**Rationale**: Game mechanics (reel offsets, currency math, win conditions) are non-obvious
and error-prone; regressions are invisible without automated coverage.

### III. User Experience Consistency

All UI interactions MUST behave identically at the target mobile resolution (720 × 1280 px)
and on desktop viewports ≥ 1280 px wide.

- The 3 × 5 slot grid MUST be visually intact at both breakpoints with no overflow or clipping.
- Icon placeholder slots MUST use fixed 32 × 32 px bounding boxes so future PNG swaps
  require zero layout changes.
- Spin animation (if implemented) MUST complete or be skippable within 5 seconds; the UI
  MUST NOT accept new input during an active spin.
- Currency display MUST update atomically after each spin — partial updates are forbidden.
- All interactive elements (Spin button, Market buy buttons) MUST meet WCAG AA contrast
  ratio (4.5 : 1 minimum).

**Rationale**: The game targets mobile-first play; layout regressions introduced by new
features are hard to spot without enforced constraints.

### IV. Performance Requirements

- Initial page load (from GitHub Pages CDN) MUST be ≤ 3 seconds on a simulated 3G connection
  (Chrome DevTools "Slow 3G" throttle).
- The JS bundle MUST be ≤ 250 KB gzipped. Any dependency that pushes the bundle past this
  limit MUST be justified in the PR description with measured size impact.
- Spin computation (reel shuffling, currency math) MUST complete in ≤ 16 ms (one frame at
  60 fps) so animation remains smooth.
- No synchronous blocking operations on the main thread during or after a spin.

**Rationale**: GitHub Pages has no server-side caching control; the bundle size and load
time are the primary performance levers available to the project.

### V. Build Pipeline Integrity

Every commit that reaches `main` MUST pass the following ordered gates. Gates MUST run
in this sequence — later gates MUST NOT start if an earlier gate fails:

1. **Typecheck** — `tsc --noEmit` (or equivalent) exits 0.
2. **Lint** — ESLint exits 0 with zero errors.
3. **Unit Tests** — All unit tests pass.
4. **Integration Tests** — All integration tests pass.
5. **Build** — Production bundle compiles without warnings treated as errors.
6. **Bundle Size Check** — Gzipped JS bundle ≤ 250 KB.

CI (GitHub Actions) MUST enforce these gates. The deploy step MUST be gated on all six
steps succeeding. No manual overrides or `--force` deploys to the `gh-pages` branch.

**Rationale**: Out-of-order gates (e.g., building before typechecking) mask errors that
surface only in production; sequential gating prevents broken deploys to GitHub Pages.

## Quality Gates

Every pull request MUST include:

- [ ] All five build pipeline gates pass in CI.
- [ ] No new TypeScript errors or ESLint errors introduced.
- [ ] New game logic covered by unit tests (≥ 80% line coverage on changed files).
- [ ] Manual smoke test at 720 × 1280 px documented in PR description (screenshot or
      screen recording acceptable).
- [ ] Bundle size delta reported (before / after gzipped size).

PRs failing any gate MUST NOT be merged. "Fix later" tickets are not an acceptable
substitute for a passing gate.

## Development Workflow

1. Branch from `main` using the `speckit-git-feature` naming convention.
2. Run `npm run typecheck && npm run lint && npm test` locally before pushing.
3. Open a PR; GitHub Actions runs all six pipeline gates automatically.
4. At least one reviewer MUST approve after gates pass.
5. Squash-merge into `main`; the deploy job triggers automatically on merge.
6. Verify the live GitHub Pages URL within 5 minutes of deploy completing.

Constitution compliance is checked as part of the plan review (`/speckit-plan` Constitution
Check gate) and MUST be re-verified after Phase 1 design is complete.

## Governance

This constitution supersedes all informal conventions. Amendments require:

1. A PR updating this file with a version bump (see versioning policy below).
2. A written rationale for the change in the PR description.
3. Approval from at least one other contributor before merge.
4. Dependent template files updated in the same PR (or a follow-up PR linked in the
   amendment PR description).

**Versioning policy**:
- MAJOR: Removal or fundamental redefinition of a principle.
- MINOR: New principle or section added, or material expansion of existing guidance.
- PATCH: Clarification, wording fix, or non-semantic refinement.

All PRs and code reviews MUST verify constitution compliance before approval.
Complexity violations MUST be documented in the Complexity Tracking table in `plan.md`.

**Version**: 1.0.0 | **Ratified**: 2026-06-06 | **Last Amended**: 2026-06-06
