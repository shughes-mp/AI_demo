# Phase 2: Evidence Provenance And Review

Status: **Complete (2026-06-19).**

## Implemented foundation

- Additive `EvidenceSignal`, `EvidenceCitation`, `EvidenceReview`, and `FacilitationRecommendation` records.
- Version metadata for schema, product, terminology, evidence, governance, prompt, parser, model configuration, source set, and facilitation rules.
- Stable dialogue citations by message ID.
- Validated source citations by reading ID, exact quote, character offsets, and deterministic passage ID.
- A source-set content hash that preserves the source context used for generation.
- Compatibility link from a new evidence signal to its legacy `Misconception` record.
- A consequential-display guard: possible misunderstandings are omitted from the evidence API unless both learner-message and source-passage citations resolve.
- Append-only instructor review actions for approve, revise, reject, mark acceptable, flag for discussion, add context, and undo.
- A rule-based learner-scoped Guide recommendation with escalation and release conditions.
- An instructor evidence-review route at `/instructor/[sessionId]/evidence`.
- Stable normalized `LearningOutcome` and `EvidenceQuestion` records synchronized from the existing authoring fields.
- Explicit many-to-many links from signals to outcomes and evidence questions, while retaining compatibility JSON IDs.
- Inactive-definition retention so historical links survive edits and checkpoint deletion.
- An atomic supersession endpoint that links reprocessed signals, preserves prior reviews, and rejects uncited replacements.
- A read-only `legacy-unversioned` compatibility section for misconceptions that predate provenance metadata.
- Separate contradiction, missing-evidence, and alternative-interpretation qualification records for each new signal.
- `AI_DEMO_USE_LOCAL_DATABASE=1` for deterministic local verification when Turso credentials are also configured.
- Clerk-backed instructor authentication with protected instructor routes and APIs.
- Session ownership plus delegated `owner`, `editor`, and `viewer` access, enforced server-side for every session API.
- Explicit legacy-session ownership assignment through `LEGACY_SESSION_OWNER_CLERK_USER_ID`; legacy sessions are never silently claimed.
- Capability tokens for account-free learners. Only a hash is stored, and the token is required for chat and session completion mutations.

## First vertical slice

For newly detected misunderstandings, the diagnostic pipeline now:

1. Records the legacy misconception for backward compatibility.
2. Requires an exact source quote from the model output.
3. Validates that quote against an uploaded reading.
4. Links the exact learner message, surrounding assistant message, and source passage.
5. Stores confidence rationale, limitations, missing evidence, and contradictory source evidence.
6. Creates a provisional learner-scoped signal.
7. Creates a deterministic Guide move.
8. Exposes the signal for instructor review only when required citations exist.
9. Preserves every instructor review in history.

## Compatibility behavior

- Legacy `Misconception` records and dashboards remain unchanged.
- Diagnostics without a validated exact source passage still create a legacy record, but do not create a consequential `EvidenceSignal`.
- Existing records are not backfilled with guessed provenance and remain legacy/unversioned.
- The migration is additive and does not rename or remove legacy fields or tables.

## Verification completed

- Evidence status-transition unit tests.
- Source matching, offsets, passage IDs, and source-set hash tests.
- Consequential citation-gate tests.
- Additive migration safety test.
- Fresh isolated-database contract test covering every migration, normalized links, citations, and restricted historical-reference deletion.
- TypeScript, ESLint, production build, and browser route verification.
- End-to-end browser verification of normalized outcome/question display plus approve and undo review history.
- Live API verification of atomic signal supersession.
- Instructor authorization role-matrix, cross-session isolation, route-coverage, and UI-action contract tests.
- Fresh-database migration coverage for session ownership, delegated access, and learner capabilities.
- Browser verification that instructor routes redirect to Clerk sign-in while learner entry remains public.
- Live learner-capability verification that invalid tokens are rejected and raw tokens are not stored.
- Review workflow verification combines browser-tested approve/undo behavior with transition and UI-action contract coverage for approve, revise, reject, mark acceptable, flag for discussion, add context, and undo.

## Operational setup

- Configure real Clerk publishable and secret keys in each deployed environment.
- Set `LEGACY_SESSION_OWNER_CLERK_USER_ID` during the first deployment that contains pre-authentication sessions, then verify those assignments before removing the variable.
- Grant additional session access through the owner-only session access API as needed.

## Acceptance gate

**Passed.** An authenticated instructor can trace, understand, correct, and audit the complete first AI-signal pathway. Session-level authorization prevents unrelated instructors from reading or changing its evidence, while learner mutations are protected by per-session capabilities.
