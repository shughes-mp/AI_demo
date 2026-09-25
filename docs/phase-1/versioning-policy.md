# AI_demo Versioning And Reproducibility Policy

Policy version: `versioning-1.0.0`

## Purpose

AI-generated evidence cannot be audited or compared responsibly unless the rules, prompts, models, parsers, and schemas that produced it are identifiable.

## Required Version Fields

Every consequential generated record must capture, as applicable:

```text
schemaVersion
productPolicyVersion
terminologyVersion
evidencePolicyVersion
governancePolicyVersion
promptVersion
modelProvider
modelId
modelConfigurationVersion
parserVersion
rubricVersion
facilitationRuleVersion
sourceSetVersion
generatedAt
```

## Versioning Scheme

Use semantic versioning:

- Major: changes meaning, compatibility, evidence criteria, or permitted claim
- Minor: adds backward-compatible fields, signal types, or rules
- Patch: fixes wording or implementation without changing intended meaning

Contract IDs may use scoped versions such as:

- `product-1.0.0`
- `terminology-1.0.0`
- `evidence-1.0.0`
- `facilitation-1.0.0`
- `governance-1.0.0`

## Prompt Versioning

- Prompts must be immutable after release.
- Any substantive edit creates a new prompt version.
- Store the resolved prompt template version, not only a source commit.
- Dynamic session content is data, not part of the prompt version.
- Prompt versions must identify expected structured output and parser compatibility.

## Model Versioning

- Store the provider and exact model identifier used.
- Do not record only a local alias such as `MODEL_PRIMARY`.
- Record relevant generation configuration when it can affect output.
- A model change requires regression evaluation against baseline fixtures.

## Parser And Rubric Versioning

- Structured-output parsers require explicit versions.
- Evidence-level criteria require rubric versions.
- A parser or rubric change must not silently reinterpret old records.
- Reprocessing creates new records linked to the records they supersede.

## Source-Set Versioning

Each generated signal must identify the exact source set used:

- File IDs
- File content hashes
- Passage identifiers
- Upload/update time

Changing a source creates a new source-set version. Existing evidence retains its original source references.

## Facilitation-Rule Versioning

- Deterministic Observer/Guide/Conductor rules require a version.
- Store which rule produced a Recommended Pivot.
- Rule changes require scenario regression tests.
- Model-personalized phrasing must remain separable from rule-based mode selection.

## Reprocessing Policy

When new models, prompts, rubrics, or rules are introduced:

- Do not overwrite historical evidence.
- Create a new inference or recommendation.
- Link it with `supersedesSignalId` where appropriate.
- Preserve instructor review of the old record.
- Clearly label reprocessed results.
- Do not treat changed AI output as changed learner performance.

## Compatibility Policy

- Legacy reports and records must remain readable during migration.
- Compatibility adapters must identify the legacy version.
- Missing version metadata must be labeled `legacy-unversioned`, not guessed.
- New features must not imply unsupported provenance for legacy records.

## Release Checklist

For any versioned AI behavior change:

- [ ] Increment the correct version.
- [ ] Document semantic change.
- [ ] Update fixtures.
- [ ] Run regression evaluation.
- [ ] Check parser compatibility.
- [ ] Check governance implications.
- [ ] Define migration/reprocessing behavior.
- [ ] Update user-facing limitations if needed.

## Phase 2 Implementation Requirement

Phase 2 must include version fields in the evidence, citation, review, and facilitation recommendation architecture before new consequential signals are introduced.

