# AI_demo Step-by-Step Implementation Roadmap

## Purpose

This roadmap converts the complete AI_demo higher-rigor recommendation set into an ordered implementation programme.

The sequence is designed to:

- Preserve pedagogical integrity
- Avoid building polished interfaces on weak evidence foundations
- Prevent incompatible terminology, prompts, APIs, and data models
- Make every consequential AI claim inspectable and reviewable
- Deliver useful vertical slices throughout implementation
- Keep instructor judgment authoritative
- Prevent formative evidence from becoming an automated grade or diagnosis

The governing principle is:

> Build trustworthy, traceable evidence before sophisticated recommendations.

## Intended Product

AI_demo is an AI-assisted teaching, learning, and formative assessment system.

Its complete operating loop should be:

1. An instructor defines the learning purpose, source materials, learning outcomes, evidence questions, teaching context, and protected assessment materials.
2. A learner engages in source-grounded dialogue requiring retrieval, interpretation, evidence, explanation, revision, and transfer.
3. AI_demo records provisional evidence of learner thinking, including misunderstanding patterns, confidence calibration, process evidence, and outcome-related evidence.
4. Every consequential signal remains traceable to learner dialogue and source material.
5. The instructor reviews, corrects, approves, or rejects those signals.
6. AI_demo recommends proportionate teaching moves, including Observer, Guide, or Conductor pivots where appropriate.
7. The instructor uses a teaching brief, live review signals, and planning tools to decide what to do next.
8. Learners receive a formative summary and an opportunity to reflect.
9. The institution can govern retention, access, privacy, and appropriate use.
10. AI_demo is evaluated against actual instructional usefulness, not proxy metrics alone.

## Delivery Rules

These rules apply across every phase.

### 1. Use Vertical Slices

Do not complete all backend work and then all frontend work. Build complete, testable pathways.

The first recommended slice is:

> One misunderstanding signal -> linked learner exchange -> linked source passage -> confidence explanation -> instructor review control -> suggested Guide move.

After that pathway works, extend the same architecture to other signal types.

### 2. Separate Observation From Inference

AI_demo must distinguish:

- Observation: what a learner actually wrote or did
- Evidence: the relevant exchange or source passage
- Inference: what the evidence may suggest
- Recommendation: what an instructor might do
- Decision: what the instructor accepts or chooses

These categories must not be collapsed into a single AI-generated verdict.

### 3. Preserve Backward Compatibility Deliberately

Existing sessions, reports, and database records may use legacy language or structures such as `mastery`, `score`, or heatmap headings.

Each migration must define:

- Whether existing data will be transformed
- Whether legacy fields remain internally supported
- How old reports continue to render
- How new and old prompt outputs are parsed
- When compatibility code can be removed

### 4. Require Evidence For Consequential Claims

No important signal, evidence level, misunderstanding pattern, or facilitation recommendation should appear without inspectable support.

### 5. Prefer Rule-Based Logic Before Model-Generated Judgment

Use deterministic rules for early facilitation pivots, confidence display, and escalation thresholds. Introduce model-generated recommendations only after the rules and evidence contracts are testable.

### 6. Treat Completed Copy Changes As Provisional

The existing terminology revision is a strong first pass, but every item marked complete in the recommendation document must be behaviorally audited. Renaming a feature does not prove that its underlying logic matches the new meaning.

## Roadmap Overview

| Phase | Objective | Depends on |
|---|---|---|
| 0 | Baseline, audit, and programme control | None |
| 1 | Product, terminology, evidence, and governance contracts | Phase 0 |
| 2 | Evidence provenance and review data model | Phase 1 |
| 3 | Source grounding and protected assessment enforcement | Phases 1-2 |
| 4 | Learner interaction and reflection | Phases 1-3 |
| 5 | Instructor evidence review surfaces | Phases 2-4 |
| 6 | Teaching brief and evidence maps | Phase 5 |
| 7 | Observer / Guide / Conductor facilitation intelligence | Phases 2, 5-6 |
| 8 | Session planning, preview, and anticipated pivots | Phases 4 and 7 |
| 9 | Governance, privacy, and institutional controls | Begins in Phase 1; completed after core flows |
| 10 | Longitudinal evidence and cross-session patterns | Phases 2, 5 and 9 |
| 11 | Evaluation, calibration, pilots, and release | Runs throughout; formal release gate after Phase 10 |

---

## Phase 0: Establish The Baseline

Status: **Complete (2026-06-18).** Deliverables are recorded in `docs/phase-0/` and `tests/fixtures/phase-0-session-scenarios.json`.

### Objective

Create an authoritative picture of what the application currently says, stores, infers, generates, and exposes.

### Tasks

- [x] Inventory all learner-facing routes and states.
- [x] Inventory all instructor-facing routes and states.
- [x] Inventory all AI prompts, structured tags, parsers, and fallbacks.
- [x] Inventory all database models related to messages, confidence, misconceptions, outcomes, engagement, reports, and topic status.
- [x] Inventory all exports and generated summaries.
- [x] Inventory API contracts used by instructor dashboards.
- [x] Search for legacy terms including `tutor`, `score`, `mastery`, `on_task`, `rubric projection`, `heatmap`, and unqualified `assessment`.
- [x] Map every recommendation-document checklist item to its implementation location.
- [x] Mark each recommendation as one of: implemented and verified, implemented but unverified, partially implemented, absent, or intentionally deferred.
- [x] Record existing tests and identify untested critical paths.
- [x] Establish representative test fixtures for pre-class, in-class preparation, in-class reflection, and after-class transfer sessions.

### Deliverables

- Current-state architecture map
- Terminology gap inventory
- Prompt and parser inventory
- Data-model inventory
- Recommendation traceability matrix
- Test-fixture pack
- Risk register

### Acceptance Gate

Every proposal in `AI_demo_higher_rigor_recommendations.md` has an owner, implementation location, dependency, and verification method.

Gate result: **Passed for baseline purposes.** The traceability matrix provides owner roles, implementation locations, dependencies, statuses, and verification methods. This does not imply the product risks are resolved.

## Phase 0.5: Repository Hygiene

Status: **Complete (2026-06-18).**

- [x] Create a dedicated `codex/phase-1-contracts` implementation branch.
- [x] Add a repeatable `npm test` command.
- [x] Remove the Node module-type warning.
- [x] Keep untracked `scratch/` tooling outside production lint scope.
- [x] Fix all production source lint errors and warnings.
- [x] Verify lint, tests, TypeScript, and production build.
- [x] Prepare Phase 0 artifacts and fixtures for a dedicated commit.

Verification result: `npm run lint`, `npm test`, `npx tsc --noEmit`, and `npm run build` all pass.

---

## Phase 1: Define The Product And Evidence Contracts

Status: **Complete (2026-06-18).** The binding contract set is recorded in `docs/phase-1/`.

### Objective

Define what AI_demo means and what it is allowed to claim before changing deeper behavior.

### 1.1 Product Contract

Formally define:

- AI_demo's purpose
- Intended instructor and learner audiences
- Formative uses
- Prohibited or unsupported uses
- The role of instructor judgment
- The meaning of a learning evidence session
- The meaning of a teaching brief
- The boundaries between learning support and assessment

### 1.2 Terminology Contract

Create one canonical terminology module or specification covering:

- `AI_demo`
- `learning session` and `learning evidence session`
- `teaching brief`
- `review signals`
- `learning outcome evidence`
- `misunderstanding patterns`
- `evidence map`
- `evidence of thinking`
- `dialogue evidence`
- `formative signal`
- `evidence level`
- `process evidence`
- `Observer`, `Guide`, and `Conductor`
- `Recommended Pivot`

Define prohibited or qualified terms:

- `score`
- `mastery`
- `on task`
- `precision`
- `rubric projection`
- `AI tutor`
- unqualified `assessment`

### 1.3 Evidence Contract

Define the minimum structure of every consequential AI output:

- Signal type
- Claim text
- Evidence references
- Relevant learning outcome or evidence question
- Relevant source-material references
- Confidence
- Confidence rationale
- Contradictory or missing evidence
- Scope: learner, group, or class
- Status: provisional, instructor-approved, revised, or rejected
- Creation model and prompt version
- Creation timestamp

Define evidence levels without treating them as grades:

- 0: no observed evidence
- 1: beginning evidence
- 2: developing evidence
- 3: proficient evidence within observed opportunities
- 4: advanced evidence within observed opportunities

Explicitly state that an evidence level is:

- Limited to observed dialogue
- Dependent on the opportunities presented
- Formative
- Incomplete as a measure of learner ability
- Subject to instructor review

### 1.4 Facilitation Contract

Define:

- Observer criteria
- Guide criteria
- Conductor criteria
- Evidence required for each recommendation
- Rules for moving between modes
- Scope of the recommendation
- How the instructor overrides a recommendation
- How quickly control should be released after a reset

### 1.5 Governance Contract

Decide:

- What learner data is stored
- Why it is stored
- How long it is retained
- Who can access it
- How deletion works
- How protected assessment content is handled
- Whether data can be used for model improvement
- Which institutional controls are required
- Which uses are prohibited

### Deliverables

- [x] Product contract
- [x] Terminology specification
- [x] Evidence schema specification
- [x] Evidence-level rubric
- [x] Facilitation-mode specification
- [x] Governance and data-use specification
- [x] Versioning policy for prompts and evidence logic

### Acceptance Gate

Product, engineering, pedagogy, and governance decisions use one shared vocabulary and one evidence model.

Gate result: **Passed at contract level.** Phase 2 must implement these contracts in the provenance, citation, review, authorization, and versioning data architecture before new consequential inference features are added.

---

## Phase 2: Build Evidence Provenance And Instructor Review Foundations

Status: **Complete (2026-06-19).** The traceable misunderstanding vertical slice, normalized outcome/question links, structured evidence qualifications, isolated migration contracts, legacy labeling, atomic supersession, Clerk authentication, session-scoped role authorization, and account-free learner capabilities are implemented. Verification and operational notes are recorded in `docs/phase-2/README.md`.

### Objective

Make every significant AI-generated signal traceable and reviewable.

### 2.1 Data Model

Foundation implemented: additive evidence signal, citation, review-history, facilitation-recommendation, normalized learning-outcome, normalized evidence-question, and explicit link entities; version metadata; legacy misconception compatibility; stable dialogue/source references; source-set hashes; and self-referential supersession chains.

Add or normalize entities for:

- Evidence signal
- Evidence citation
- Dialogue exchange reference
- Source-material citation
- Learning outcome link
- Evidence-question link
- Confidence and rationale
- Contradictory evidence
- Instructor review
- Instructor revision
- Instructor rejection reason
- Prompt/model version
- Facilitation recommendation

Avoid destructive renames of legacy database fields until migration and compatibility behavior are established.

### 2.2 API Contracts

Implemented: typed signal listing, review mutation, and atomic supersession APIs return citations, confidence explanation, review history, normalized outcomes/questions, related dialogue/source passages, legacy provenance labels, and the initial Guide recommendation. Clerk identity and session-scoped owner, editor, and viewer authorization protect every instructor session API.

Create typed APIs that return:

- Signal plus citations
- Signal confidence plus explanation
- Review state
- Review history
- Related learner dialogue
- Related source passage
- Related outcome or evidence question
- Recommended teaching move, when available

### 2.3 Review Workflow

First-slice controls implemented: approve, revise, reject, mark acceptable, flag for discussion, add context, and undo, with append-only history.

Implement instructor controls:

- Approve
- Revise
- Reject
- Mark as acceptable interpretation
- Flag for class discussion
- Add contextual note
- Record why the AI signal was changed

### 2.4 First Vertical Slice

Implemented for newly detected, exactly source-cited possible misunderstandings. Diagnostics that cannot validate a source quote remain available only through the legacy misconception path and are not exposed as consequential evidence signals.

Implement one complete misunderstanding pathway:

1. Detect a possible misunderstanding.
2. Link it to the learner exchange.
3. Link it to the relevant source passage.
4. Explain confidence and uncertainty.
5. Display contradictory or missing evidence.
6. Allow instructor approval, revision, or rejection.
7. Generate one evidence-linked Guide recommendation.
8. Record the instructor decision.

### Verification

- Unit tests for evidence schema and status transitions
- API contract tests
- Migration tests
- Authorization tests
- UI tests for approve, revise, reject, and undo
- Tests that a signal cannot be rendered as consequential without citations

### Acceptance Gate

An instructor can trace, understand, correct, and audit the first complete AI signal pathway.

Gate result: **Passed.** The complete pathway is citation-gated, versioned, reviewable, append-only, authenticated, session-authorized, and covered by migration, contract, authorization, UI-action, build, and browser verification.

---

## Phase 3: Enforce Source Grounding And Assessment Protection

Status: **Complete (2026-06-19; source-first policy refined 2026-06-19).** Passage retrieval, validated tutor-response citations, source-first use of broader model knowledge, unsupported-source-attribution handling, protected-material isolation and interception, audit persistence, instructor-visible grounding review, additive migrations, adversarial tests, and running-app verification are implemented. Details and limitations are recorded in `docs/phase-3/README.md`.

### Objective

Make source grounding and protected assessment behavior operational rather than merely described in copy.

### 3.1 Source Grounding

- [x] Associate AI claims with uploaded source passages.
- [x] Require source support for course-content claims.
- [x] Provide an explicit unsupported-by-source response path.
- [x] Show source citations to instructors.
- [x] Decide when source citations should be visible to learners.
- [x] Test conflicting, incomplete, and ambiguous source sets.
- [x] Prevent arbitrary outside knowledge from silently overriding instructor materials.
- [x] Allow clearly identified broader model knowledge for explanation, examples, connections, application, and critique without presenting it as reading content.

### 3.2 Protected Assessment Materials

- [x] Separate protected assessment content from learner-visible source context.
- [x] Prevent direct answer disclosure.
- [x] Permit coaching on reasoning without reproducing protected answers.
- [x] Add adversarial tests for answer extraction.
- [x] Add instructor-visible audit records when protected material influences coaching.
- [x] Define behavior when a source and protected answer conflict.

### 3.3 Instructor Workspace

Verify and complete:

- Purpose & Outcomes
- Source Materials
- Evidence Questions
- Learner Link
- Evidence-readiness status summary
- Source-grounding explanation
- Protected-assessment explanation
- Teaching context
- Interaction style
- Foundational concept map

Verification result: all listed workspace capabilities remain operational, with new readiness explanations and a dedicated Grounding & Protection audit surface.

### Acceptance Gate

Course-content claims are source-grounded, protected answers are not exposed, and both behaviors are testable and visible to the instructor.

Gate result: **Passed.** Enforcement occurs before learner display, protected material is excluded from normal generation context, and versioned audit records make both outcomes inspectable.

---

## Phase 4: Strengthen The Learner Learning Experience

Status: **Complete (2026-06-19).** Learner orientation, an eight-step productive-struggle ladder, purpose-aware learning behaviors, formative summary safeguards, learner reflection and summary correction, additive persistence, and learner-experience verification are implemented. Details are recorded in `docs/phase-4/README.md`.

### Objective

Ensure the core conversation produces genuine learning and useful evidence without becoming an answer engine or hidden grading experience.

### 4.1 Learner Orientation

Verify that learners understand:

- What AI_demo is
- What it will ask them to do
- That it uses instructor-provided materials
- That it will not simply provide answers
- That their instructor may review the conversation formatively
- That thoughtful reasoning matters more than speed
- That AI-generated summaries may be incomplete

### 4.2 Productive-Struggle Policy

Implement and test a consistent help ladder:

1. Ask for current thinking.
2. Ask for relevant evidence.
3. Narrow the task.
4. Add a constraint or comparison.
5. Offer a hint.
6. Model a limited reasoning move.
7. Give a direct clarification only when pedagogically justified.
8. Ask the learner to restate or apply the corrected idea.

### 4.3 Learning Behaviors

Ensure purpose-aware support for:

- Retrieval
- Self-explanation
- Interpretation
- Evidence use
- Argument evaluation
- Misunderstanding repair
- Confidence calibration
- Transfer
- Synthesis

### 4.4 Learner Summary And Reflection

Implement:

- Purpose-neutral summary language
- Topics covered
- Where the learner showed strong understanding
- What is worth revisiting
- A question to carry forward
- Explicit AI limitation language
- A learner reflection step

Suggested reflection prompts:

- What changed in your thinking?
- Which claim can you now support with evidence?
- What remains uncertain?
- What will you try next?
- Is any part of the AI-generated summary inaccurate or incomplete?

Allow the learner to annotate or contest the summary before instructor review where appropriate.

### 4.5 Learner Experience Verification

Test:

- Direct answer requests
- Repeated help requests
- Unsupported claims
- Confident misunderstandings
- Low-confidence correct reasoning
- Attempts to extract protected answers
- Very short responses
- Long but superficial responses
- Accessibility and mobile behavior
- Different communication styles

### Acceptance Gate

Learner dialogue consistently asks for cognitive work, adapts help proportionately, produces inspectable evidence, and communicates its formative purpose clearly.

Gate result: **Passed.** Help requests advance proportionately through a persisted ladder, purpose-aware prompts cover the required learning behaviors, and learners can annotate or contest explicitly limited AI summaries before instructor review.

---

## Phase 4.5: Security And Reliability Hardening

Status: **Complete (2026-06-20); external key rotation confirmed (2026-06-22).** The repository now has secret-safe ignore rules, updated dependencies with a zero-finding package audit, CI quality gates, lazy service initialization, route failure states, learner request throttling, owner-controlled session deletion, and additional regression tests. See `docs/phase-4/hardening-audit.md`.

The previously committed Anthropic key remains permanently invalid and must never be reused. Revocation and replacement in Anthropic and Vercel were confirmed during the Phase 7 operational checks.

Remaining governance work—automatic retention, export, institutional privacy policy, distributed rate limiting, durable diagnostic retries, and full evaluation—stays explicitly assigned to later roadmap phases rather than being silently treated as complete.

---

## Phase 5: Build Instructor Evidence Review Surfaces

Status: **Implementation complete and deployed (2026-06-21).** Consequential signals now expose evidence, uncertainty, opportunity coverage, review history, filters, source-linked misunderstanding instances, and corrected downstream review-state behavior. Viewer reads are non-mutating and report generation requires editor access. See `docs/phase-5/README.md`.

### Objective

Turn instructor dashboards into auditable evidence-review tools rather than automated judgment displays.

### Recommended Implementation Order

1. Evidence excerpts beside each major signal
2. Source-material citations
3. Confidence explanation
4. Contradictory or missing evidence
5. Instructor approve, revise, and reject controls
6. Review history
7. Filters and sorting
8. Aggregate patterns
9. Export behavior

### 5.1 Live Review Signals

Complete the monitoring language and behavior:

- `Live review signals`
- `No current review signals detected`
- `May need follow-up`
- `Possible engagement concern`
- `Outcome evidence`
- `Topic evidence`

Do not infer motivation, attention, or engagement from silence alone.

For each live signal show:

- What was observed
- Why it was flagged
- How uncertain the inference is
- Relevant exchange
- How long ago it occurred
- Suggested instructor action, if any

### 5.2 Learning Outcome Evidence

For every evidence-level display include:

- Evidence level
- Evidence summary
- Confidence
- Process evidence
- Misunderstanding signals
- Evidence questions addressed
- Hint support used
- Number and diversity of opportunities
- Instructor review state

### 5.3 Misunderstanding Patterns

Implement:

- Pattern-level evidence excerpts
- Learner-level instances
- Source links
- Prevalence with denominator
- Resolution evidence
- Confidence
- Instructor overrides
- Mark as acceptable
- Flag for class discussion
- Review evidence

Avoid treating prevalence as severity or correctness certainty.

### 5.4 Filters

Add filters for:

- Learning outcome
- Evidence question
- Evidence strength
- Confidence
- Review state
- Unresolved signal
- Learner
- Session purpose
- Facilitation mode, after Phase 7

### Acceptance Gate

An instructor can inspect and correct every consequential signal without opening raw database records or trusting a summary blindly.

Gate result: **Passed and operationally verified.** The evidence-review workflow is covered by automated authorization, filtering, review-state, aggregation, and interface contracts. Authenticated production checks confirmed the deployed evidence surface, viewer read-only enforcement, stale-brief behavior, and desktop/mobile keyboard accessibility.

---

## Phase 6: Complete Teaching Briefs And Evidence Maps

Status: **Complete and deployed (2026-06-21).** Reports now persist a versioned structured brief alongside the narrative, expose purpose-specific evidence maps with inspectable provenance and review state, and export formative-use and model/prompt metadata. See `docs/phase-6/README.md`.

### Objective

Create a concise, evidence-linked instructor synthesis that supports action without implying diagnostic certainty.

### 6.1 Teaching Brief Structure

Implement:

- Session snapshot
- How to read this brief
- Suggested teaching moves
- Purpose-specific evidence map
- What the evidence suggests learners can build on
- Where the evidence suggests follow-up
- Misunderstanding patterns
- Per-learner notes
- Learning outcome evidence
- AI and formative-use disclaimer
- Instructor review status

### 6.2 How To Read This Brief

Explain:

- What evidence was observed
- What AI_demo inferred
- What confidence means
- What the brief does not establish
- How instructors can inspect sources
- How to approve, revise, or reject signals
- Why the brief should not be used as an automated grade

### 6.3 Evidence Maps

Use:

- Readiness Evidence Map
- Activation Evidence Map
- Consolidation Evidence Map
- Transfer Evidence Map

Use labels:

- Evidence suggests ready
- Evidence suggests gaps
- Evidence suggests review

Each map item must link to:

- Underlying learner evidence
- Number of learners represented
- Opportunity coverage
- Confidence
- Contradictory evidence
- Instructor review state

### 6.4 Report Generation

Update prompts and structured outputs to:

- Tie recommendations to actual evidence
- Avoid generic advice
- Separate observation, inference, and recommendation
- Distinguish resolved and unresolved signals
- Use representative quotes sparingly
- Produce structured evidence objects, not prose-only claims
- Preserve prompt and model version information

### 6.5 Export

Exported briefs must include:

- Formative-use statement
- AI-generated statement
- Generation time
- Instructor review state
- Evidence references or an appendix
- Session purpose
- Model/prompt version where institutionally required

### Acceptance Gate

The teaching brief is concise, actionable, inspectable, and impossible to mistake for an unreviewed summative assessment.

Gate result: **Passed and deployed.** The interface and export identify formative and AI-generated content, expose provisional review states, link map items to supporting evidence, preserve generation metadata, and successfully export a real deployed teaching brief.

---

## Phase 7: Implement Facilitation Intelligence

Status: **Complete, deployed, and operationally verified (2026-06-22).** Deterministic Observer, Guide, and Conductor recommendations are evidence-linked, visible in live review, teaching briefs, and PDF exports, and fully controlled by instructors. Model-assisted mode selection remains intentionally gated. See `docs/phase-7/README.md`.

### Objective

Help instructors decide how much to intervene, when to intervene, and how to preserve learner thinking.

### 7.1 Start With Deterministic Rules

Implement initial rules such as:

| Signal | Initial mode | Rationale |
|---|---|---|
| Learners are producing usable reasoning and building on evidence | Observer | Preserve learner control |
| Isolated confusion or stalled reasoning | Guide | Provide a focusing prompt without supplying the answer |
| Active but shallow reasoning | Guide | Add evidence, comparison, justification, or counterargument constraints |
| No usable output yet | Guide | Help learners converge on a claim or decision |
| Widespread shared misunderstanding | Conductor | Brief whole-class clarification is proportionate |
| Learners cannot state the task or next step | Conductor | Relaunch the task clearly |
| Participation remains concentrated after a nudge | Conductor | Reset the participation structure |

### 7.2 Recommended Pivot Object

Every pivot recommendation should contain:

- Mode: Observer, Guide, or Conductor
- Scope: learner, group, or class
- Triggering evidence
- Diagnosis question
- Rationale
- Suggested move
- Ready-to-use phrase
- Confidence
- Escalation condition
- Release condition
- Instructor review state

### 7.3 Live Review Integration

For live sessions show:

- Recommended Pivot
- Why this mode is suggested
- Evidence supporting it
- One proportionate move
- Whether to observe, guide, or reset
- When to step back again

Do not automatically trigger instructor interventions.

### 7.4 Teaching Brief Integration

For each major class-level pattern, include:

- Recommended facilitation mode
- Evidence scope
- Suggested phrase
- Whether the issue is isolated or widespread
- What would justify escalation or de-escalation

### 7.5 Instructor Controls

Allow instructors to:

- Accept the pivot
- Select a different mode
- Edit the suggested phrase
- Record the move used
- Record whether it helped
- Explain why a recommendation was inappropriate

### 7.6 Model-Assisted Recommendations

Only after rule-based behavior is evaluated:

- Use a model to personalize phrases and moves.
- Keep mode selection constrained by evidence and explicit rules.
- Compare model recommendations against instructor judgments.
- Never conceal whether a recommendation came from rules or model inference.

### Acceptance Gate

Every facilitation recommendation is proportionate, evidence-linked, instructor-controlled, and includes a clear release condition.

Gate result: **Passed and deployed.** Rule tests and authenticated production sessions cover proportional Observer, Guide, and Conductor decisions, including restraint when evidence is sparse. Live review, teaching briefs, and PDF exports expose evidence, confidence, escalation, release, provenance, and instructor controls. Instructor acceptance, override, rejection with rationale, edited phrasing, move recording, helpfulness, viewer restrictions, and accessibility checks all passed.

---

## Phase 8: Add Planning, Preview, And Anticipated Pivot Points

Status: **Implementation complete, locally verified, and authenticated-production-smoke-tested (2026-06-23).** The instructor workspace now includes a faithful learner preview, deterministic quality checks, participation planning, and editable Guide-first anticipated pivots. Saved opening, task, and output language is delivered into the actual learner experience, and planning changes invalidate older teaching briefs. The production smoke test confirmed Plan & preview, generated pivots, learner progress, grounding audit, evidence review, and teaching brief integration. Details are recorded in `docs/phase-8/README.md`.

### Objective

Connect evidence and facilitation logic to session design before learners begin.

### 8.1 Learner Experience Preview

Allow instructors to preview:

- Learner orientation
- Opening question
- Session purpose
- Evidence questions
- Help behavior
- Source-grounding message
- Protected-assessment behavior
- Summary and reflection experience

### 8.2 Anticipated Pivot Points

For each session generate or let instructors define:

- Likely wobble point
- What to watch for
- Diagnosis question
- Initial facilitation mode
- Guide phrase
- Conductor phrase
- Escalation condition
- Release condition
- Intended usable output for debrief

### 8.3 Session Design Quality Checks

Check for:

- Recall-only evidence questions
- Too many questions for available exchanges
- Outcomes without evidence opportunities
- Missing source support
- Ambiguous task instructions
- Protected assessment overlap
- No planned usable output
- No planned response to likely widespread confusion

### 8.4 Participation Planning

Where relevant, prompt instructors to prepare:

- Individual thinking time
- Pair or group exchange
- Alternative response channels
- A plan for quieter voices
- A reset if participation remains concentrated

### Acceptance Gate

An instructor can preview the learner experience and enter a session with plausible pivot points and phrases already prepared.

Gate result: **Passed locally.** Contract and interface tests confirm the complete learner preview, all required design warnings, viewer/editor authorization, bounded Guide and Conductor preparation, participation planning, and delivery into learner orientation and tutor prompts. Authenticated deployed verification remains before the phase is marked operationally verified.

---

## Phase 8.5: Instructor Workflow, Progressive Disclosure, And Accessibility Pass

Status: **Complete and locally verified (2026-06-23).** This phase does not add new intelligence. It makes the existing evidence, source-use, planning, and teaching-brief capabilities feel calmer, more sequential, and more usable for a first-time instructor.

### Objective

Make AI_demo feel clear, obvious, and instructor-controlled without reducing evidence rigor.

### 8.5.1 Instructor Journey

Reframe the session workflow around:

- Before learners begin
- During learner work
- After learner work

Use teacher-facing labels by default:

- Set up session
- Preview learner experience
- Share with learners
- Learner activity
- Review learner evidence
- Source use check
- Prepare teaching brief

### 8.5.2 Progressive Disclosure

Default instructor pages should show:

1. Plain summary
2. Evidence on request
3. Technical/source-use details on request

Source passages, confidence, review state, model/version metadata, grounding audit records, protected assessment logic, instructor overrides, move recording, and export provenance remain available.

### 8.5.3 Guided Hub And Setup Separation

The session workspace should show:

- current status
- primary next step
- required setup
- recommended preparation
- optional/advanced checks

Implemented completion pass:

- Required setup is explicitly separated from recommended preview/planning and optional trust checks.
- The learner link is gated behind learning purpose, source material, evidence question, and saved learner preview checks.
- Source-use safeguards and owner-only deletion controls are hidden behind progressive disclosure.
- Recall-only evidence questions receive a visible caution so instructors can revise toward interpretation, comparison, application, or source evidence.

### 8.5.4 Accessibility And Clarity

The UI should use clear headings, visible controls, plain-language empty states, status text that is not color-only, consistent button hierarchy, and page-level next-step cues.

### Acceptance Gate

A naive instructor can create, preview, share, monitor, review, and export a session without needing to understand internal AI_demo terminology, while still being able to inspect evidence and source-use details when desired.

Gate result: **Passed locally.** Type checking, linting, the full test suite, and production build pass after the completion pass. The remaining deployment smoke test should verify the preview-to-share path in the authenticated production environment.

---

## Phase 9: Complete Governance, Privacy, And Institutional Controls

### Objective

Make appropriate use, data handling, and human authority operational across the system.

This work begins in Phase 1 and proceeds alongside all other phases.

### 9.1 Learner Transparency

Communicate:

- What data is collected
- Why the conversation is collected
- Who can review it
- What AI_demo infers
- What AI_demo does not establish
- How long data is retained
- Whether the learner can access or contest summaries

### 9.2 Access And Retention

Implement:

- Role-based access
- Session-level authorization
- Retention settings
- Deletion workflows
- Export controls
- Audit logs
- Protected assessment access restrictions

### 9.3 Institutional Controls

Consider:

- Configurable retention policies
- Required formative-use notices
- Model/provider controls
- Data-region requirements
- Institutional review records
- Feature flags for experimental inference types
- Ability to disable learning-outcome evidence levels

### 9.4 Prohibited Uses

Explicitly prohibit or technically constrain:

- Fully automated grading
- Unreviewed high-stakes decisions
- Claims of general intelligence or ability
- Behavioral diagnosis from silence or response time alone
- Hidden learner surveillance
- Training on learner data without appropriate authority

### Acceptance Gate

Data handling, access, retention, review authority, and prohibited uses are documented, visible, and enforced.

---

## Phase 10: Add Longitudinal And Cross-Session Evidence

### Objective

Help instructors identify persistent patterns without converting provisional evidence into pseudo-precise learner scores.

### Preconditions

Do not begin until:

- Individual-session provenance is reliable.
- Instructor review states are stored.
- Governance and retention decisions are implemented.
- Evidence opportunities are represented.

### Features

- Persistent misunderstanding patterns
- Learning-outcome evidence across sessions
- Confidence calibration over time
- Repeated support dependence
- Transfer across contexts
- Instructor-approved pattern history
- Change in evidence after targeted teaching moves

### Design Requirements

- Show the underlying sessions and evidence.
- Separate reviewed from unreviewed signals.
- Represent missing opportunities explicitly.
- Do not average evidence levels into a single learner score.
- Do not compare learners without adequate contextual qualification.
- Allow instructors to suppress invalid historical signals.

### Acceptance Gate

Longitudinal views preserve context, provenance, opportunity coverage, and instructor review.

---

## Phase 11: Evaluation, Calibration, Pilots, And Release

### Objective

Determine whether AI_demo improves learning and instructional decision-making in practice.

Evaluation starts in Phase 0 and continues throughout implementation.

### 11.1 Technical Evaluation

Measure:

- Source-grounding accuracy
- Citation correctness
- Protected-answer leakage
- Structured-output validity
- Parser reliability
- Authorization correctness
- Data-retention correctness
- Prompt-version reproducibility

### 11.2 Evidence Evaluation

Measure:

- Signal precision and recall against instructor review
- False positives and false negatives
- Inter-rater agreement
- Confidence calibration
- Contradictory-evidence handling
- Learning-outcome evidence validity
- Misunderstanding clustering quality

### 11.3 Pedagogical Evaluation

Measure:

- Quality of learner reasoning
- Use of evidence
- Self-explanation quality
- Misunderstanding repair
- Transfer
- Productive struggle
- Answer-seeking and over-reliance
- Whether direct help arrives too early or too late

### 11.4 Facilitation Evaluation

Measure:

- Agreement between AI_demo and instructor mode choices
- Appropriateness of Observer recommendations
- Appropriateness of Guide prompts
- Proportionality of Conductor resets
- Whether suggested phrases are usable
- Whether the recommended move restored momentum
- Whether control was released at the right time

### 11.5 Experience And Equity Evaluation

Measure:

- Learner comprehension of the system's role
- Instructor comprehension of formative evidence
- Instructor workload
- Time to find and act on a signal
- Accessibility
- Differences across communication styles
- Differences across learner groups
- Whether quiet, concise, multilingual, or non-standard responses are misclassified

### 11.6 Outcome Evaluation

Measure:

- Whether teaching decisions changed
- Whether those changes were useful
- Whether instructors trusted the right outputs
- Whether learners improved on subsequent tasks
- Whether AI_demo reduced or increased instructor workload
- Whether evidence maps and pivots improved class preparation

### Pilot Sequence

1. Internal fixture-based testing
2. Expert educator review
3. Small supervised pilot
4. Instructor calibration study
5. Learner usability study
6. Limited real-course deployment
7. Cross-course evaluation
8. Institutionally governed release

### Release Gate

AI_demo should not be treated as production-ready for consequential educational use until:

- Evidence claims are traceable.
- Instructor review works end to end.
- Learner disclosure is clear.
- Protected assessment leakage is acceptably controlled.
- Facilitation recommendations are demonstrably proportionate.
- Known limitations are documented.
- Evaluation results support the intended use.

---

## Recommended Vertical Slice Sequence

Use these slices to deliver value while preserving the phase dependencies.

### Slice 1: Reviewable Misunderstanding Signal

- One learner misunderstanding
- Dialogue and source evidence
- Confidence explanation
- Instructor approve/revise/reject
- One Guide recommendation

### Slice 2: Reviewable Learning Outcome Evidence

- One outcome
- Opportunity count
- Evidence excerpts
- Process evidence
- Evidence level and limitations
- Instructor review

### Slice 3: Class-Level Pattern

- Cluster related reviewed signals
- Show prevalence and denominator
- Show contradictory evidence
- Recommend Guide or Conductor based on scope

### Slice 4: Live Review Signal

- Time-sensitive evidence
- Clear uncertainty
- Recommended pivot
- Ready-to-use phrase
- Instructor response capture

### Slice 5: Evidence-Linked Teaching Brief

- Session snapshot
- How to read
- Evidence map
- Suggested teaching moves
- Review status

### Slice 6: Planning Loop

- Anticipated pivot
- Learner preview
- Instructor phrase
- Compare anticipated and observed patterns

### Slice 7: Longitudinal Pattern

- Reviewed signals across sessions
- Opportunity-aware trend
- Evidence drill-down
- Teaching-move outcome

## Cross-Cutting Testing Strategy

Every phase should add tests at the appropriate layers.

### Unit Tests

- Evidence rules
- Confidence rules
- Facilitation-mode rules
- Parsers
- Prompt-output normalization
- Review-state transitions

### Integration Tests

- Chat -> diagnostic -> evidence record
- Evidence record -> instructor review
- Reviewed evidence -> teaching brief
- Evidence pattern -> facilitation recommendation
- Protected content -> safe coaching response

### End-To-End Tests

- Instructor creates session
- Learner joins and completes dialogue
- Instructor reviews evidence
- Instructor changes an AI signal
- Teaching brief reflects reviewed state
- Export includes limitations
- Learner summary and reflection work

### Adversarial Tests

- Prompt injection in source files
- Protected-answer extraction
- Unsupported external claims
- Confident but incorrect learner statements
- Sparse learner responses
- Contradictory source materials
- Attempts to use evidence levels as grades
- Misleading engagement inferences

### Visual And Accessibility Tests

- Desktop and mobile layouts
- Long evidence excerpts
- Long learner and outcome names
- Keyboard navigation
- Screen-reader labels
- Color-independent evidence-map status
- No overlapping controls or truncated uncertainty text

## Programme-Level Definition Of Done

The recommendation programme is complete only when all of the following are true.

### Purpose And Language

- [x] A naive reader can explain AI_demo's purpose accurately.
- [x] Terminology is consistent across UI, prompts, APIs, exports, and documentation.
- [x] No visible feature implies automated grading or complete learner diagnosis.

### Learner Experience

- [x] Learners understand the role of AI_demo and instructor review.
- [x] Conversations require reasoning rather than merely answer retrieval.
- [x] Help is graduated and proportionate.
- [x] Learners receive a formative summary and reflection opportunity.

### Evidence Integrity

- [x] Every consequential signal is traceable to evidence.
- [x] Confidence and uncertainty are explained.
- [x] Missing and contradictory evidence are represented.
- [x] Evidence opportunities are recorded.

### Instructor Authority

- [x] Instructors can approve, revise, reject, and annotate AI signals.
- [x] Reviewed and unreviewed outputs are visibly distinct.
- [x] Teaching briefs reflect instructor review states.

### Facilitation Intelligence

- [x] Observer, Guide, and Conductor are explicitly defined.
- [x] Recommended pivots are evidence-linked and proportionate.
- [x] Instructors can override pivots.
- [x] Every pivot includes an escalation or release condition.
- [ ] Anticipated pivot points are supported during planning.

### Trust And Governance

- [x] Source grounding is operational.
- [x] Protected assessment answers are not disclosed.
- [ ] Privacy, retention, access, and deletion controls are implemented.
- [ ] Prohibited uses are documented and constrained.

### Evaluation

- [x] Technical reliability is measured.
- [ ] Evidence accuracy is calibrated against instructors.
- [ ] Pedagogical effects are evaluated.
- [ ] Equity and accessibility are evaluated.
- [ ] Real instructional usefulness is demonstrated.

## Immediate Next Actions

Phase 7 closure completed before beginning Phase 8:

1. [x] Commit, push, and deploy the completed Phase 7 implementation.
2. [x] Run an authenticated real-session smoke test covering Observer, Guide, and Conductor recommendations; instructor override, rejection reason, move recording, helpfulness, and report/PDF refresh.
3. [x] Confirm viewer access remains read-only and cannot refresh or modify recommendations.
4. [x] Complete the authenticated desktop/mobile keyboard and color-independent-label pass.
5. [x] Confirm the previously exposed Anthropic credential has been revoked and replaced.
6. [x] Compare early rule recommendations with instructor judgments; model-assisted mode selection remains disabled pending broader evaluation.
