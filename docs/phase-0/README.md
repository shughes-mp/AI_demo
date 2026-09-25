# Phase 0 Baseline

Status: Complete as of 2026-06-18.

This directory records the implementation baseline for the AI_demo higher-rigor roadmap. It is descriptive, not a claim that the identified behavior is valid or production-ready.

## Deliverables

- [architecture-inventory.md](architecture-inventory.md): routes, components, APIs, prompts, data flows, persistence, and exports.
- [terminology-gap-inventory.md](terminology-gap-inventory.md): visible and internal terminology alignment.
- [recommendation-traceability-matrix.md](recommendation-traceability-matrix.md): every recommendation area mapped to status, implementation location, owner role, dependency, and verification.
- [test-baseline.md](test-baseline.md): current automated checks, coverage gaps, and fixture catalogue.
- [risk-register.md](risk-register.md): prioritized product, pedagogical, privacy, security, and technical risks.
- [../../tests/fixtures/phase-0-session-scenarios.json](../../tests/fixtures/phase-0-session-scenarios.json): representative scenarios for all four session purposes.

## Status Vocabulary

- **Implemented and verified**: behavior exists and has relevant verification.
- **Implemented but unverified**: behavior exists, but verification is insufficient.
- **Partially implemented**: only part of the recommendation exists or the UI label is ahead of behavior.
- **Absent**: no meaningful implementation was found.
- **Deferred**: intentionally sequenced into a later roadmap phase.

## Baseline Conclusion

AI_demo has a substantial functional prototype: instructors can configure sessions and sources, learners can complete guided conversations, diagnostics run after exchanges, and instructors can view reports, patterns, recommendations, and PDF exports.

The main gap is epistemic infrastructure. Important outputs are generated from model classifications, heuristics, prose, and JSON-encoded strings without first-class evidence citations, prompt versioning, review provenance, or complete authorization. The visible language has moved toward formative evidence, but the persisted model and several prompts still encode stronger concepts such as mastery, assessment, engagement diagnosis, severity, and scoring.

Phase 1 should therefore begin with product, terminology, evidence, facilitation, and governance contracts. It should not begin with another dashboard feature.

Phase 1 contract outcome: completed in [../phase-1/README.md](../phase-1/README.md).
