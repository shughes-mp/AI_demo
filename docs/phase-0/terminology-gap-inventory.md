# Terminology And Behavioral Gap Inventory

## Summary

The June 2026 copy revision substantially improved visible product language. The implementation remains mixed: visible labels often use formative evidence language while prompts, types, database models, API fields, code symbols, README text, and heuristics retain stronger tutor, assessment, mastery, engagement, severity, and scoring concepts.

This is not only a naming issue. Some legacy terms correspond to behavior that can overstate what the available evidence establishes.

## Alignment By Layer

| Layer | Current alignment | Status |
|---|---|---|
| Landing page | Teaching, learning, formative evidence, instructor judgment | Implemented but unverified with naive readers |
| Session creation | Learning evidence session language | Implemented but unverified |
| Workspace | Source grounding, evidence questions, protected materials | Partially implemented; behavior lacks citations and robust protection tests |
| Learner entry/chat | AI_demo, reasoning, formative review, source grounding | Partially implemented; system prompt still self-identifies as tutor |
| Learner summary | Purpose-neutral formative summary | Implemented but unverified |
| Instructor monitoring | Review signals and evidence language | Partially implemented; underlying API still uses engagement flags and rubric status |
| Teaching brief | Evidence language and evidence maps | Partially implemented; generated report remains prose and tag extraction |
| Misunderstanding patterns | Softer visible language and limited override | Partially implemented; records remain diagnostic `Misconception` objects with severity |
| Learning outcome evidence | Visible evidence-level labels | Partially implemented; persisted type is `LOAssessment` and generated from model tags |
| README | Broad product positioning is improved | Partially aligned; still uses tutor, mastery, engagement, and assessment language |
| Database | Legacy assessment/mastery/diagnostic model | Not aligned |
| Prompts | Strong pedagogy and source rules, but tutor/mastery/assessment language remains | Partially aligned |
| APIs and TypeScript | Legacy names and strong classifications remain | Not aligned |
| Exports | AI_demo branding and prose report | Partially aligned; lacks review/provenance metadata |

## Preferred Terms And Remaining Gaps

### AI_demo

Present in visible branding and revised UI.

Remaining gaps:

- `system-prompt.ts` starts with “Socratic reading tutor.”
- Directed stance says “directed Socratic tutor.”
- Diagnostic prompt refers to tutor/student roles.
- CSS and component class names use tutor terminology; these are low-risk internal names.
- README repeatedly refers to “the tutor.”

### Learning Session / Learning Evidence Session

Present on creation surfaces.

Remaining gaps:

- Database and API model remains generic `Session`.
- No explicit field captures evidence-use agreement or review policy.
- Session completion criteria emphasize source plus outcome but not governance or evidence readiness.

### Teaching Brief

Present in visible instructor navigation and report heading.

Remaining gaps:

- Database model remains `Report` with prose `content` and JSON-string `stats`.
- API and route names remain `/report`.
- Generator emits prose sections and hidden tags rather than first-class evidence objects.
- Existing brief has no “How to read this brief” section.
- Review status is not represented.

### Review Signals

Present in monitoring labels.

Remaining gaps:

- API exposes `latestEngagementFlag`, `hasRecentEngagementConcern`, and wait-time inference.
- Diagnostic values are `on_task`, `shallow`, `disengaged`, `off_topic`, and `hostile`.
- Silence/wait time contributes to “may need follow-up” without contextual evidence.
- No general review-signal record exists.

### Learning Outcome Evidence

Present in UI headings and evidence-level badges.

Remaining gaps:

- Type and table are `LOAssessment`.
- Status values differ between TypeScript legacy types and report-generator 0-4 values.
- The model is asked to “assess” each learner.
- Evidence is a prose summary without exchange IDs or source citations.
- Opportunity count and contradictory evidence are not first-class.

### Misunderstanding Patterns

Present in visible headings.

Remaining gaps:

- Database, APIs, route folders, types, and variable names use `Misconception`.
- Model classifies type, severity, and confidence.
- Cluster override is keyed by mutable `clusterLabel`, not stable evidence identity.
- “Severity” remains visible.
- Instructor review applies at cluster level only and does not revise underlying records.

### Evidence Maps

Present in purpose-based titles and visible badges.

Remaining gaps:

- Component and parser remain `ReadinessHeatmap` and `heatmap` internally.
- Parser supports legacy headings, which is appropriate for compatibility.
- Map content is parsed from model prose rather than structured evidence records.
- Green/yellow/red may imply stronger measurement than the evidence supports.

### Topic Evidence

Present as a visible replacement for topic mastery.

Remaining gaps:

- `TopicMastery` table, relation, module, API property, and status `mastered` remain.
- `evaluateMastery` can mark mastery when two heuristic criteria are met.
- Criteria do not represent source citations, opportunity diversity, or instructor review.

### Evidence Level

Present in `LOAssessmentCard` and instructor tables.

Remaining gaps:

- Monitoring sometimes displays `Evidence: n / 4`, while cards display `Evidence level`.
- The 0-4 scale can still be interpreted as a grade.
- Labels include “Proficient” and “Advanced” without always stating “within observed opportunities.”
- Report logic caps ratings based on unresolved high-severity misconceptions, a strong rule without validation.

### Interaction Style

Present visibly instead of tutor stance.

Remaining gaps:

- Database and API field remains `stance`.
- Allowed values remain `directed` and `mentor`.
- No empirical or instructor-configurable relationship exists between style and facilitation mode.

### Observer / Guide / Conductor

Absent from implementation.

Required later:

- Canonical definitions
- Evidence-to-mode rules
- Recommended Pivot object
- Instructor override
- Escalation and release conditions
- Planning and live-review integration

## Strong Claims Requiring Behavioral Review

| Current mechanism | Why it may overclaim | Required future correction |
|---|---|---|
| `TopicMastery.status = mastered` | Two heuristic criteria can imply mastery | Replace with opportunity-bounded topic evidence and instructor review |
| Engagement classification | Model labels motivation/behavior from text | Limit to observable interaction patterns and explain uncertainty |
| Wait-time concern | Delay may reflect many non-learning causes | Present observation separately from possible inference |
| Misconception severity | Model-derived severity may be unstable | Define evidence contract and instructor review |
| 0-4 outcome evidence | Scale resembles grading | State scope, opportunities, citations, and non-summative status |
| Green/yellow/red evidence map | Color implies stable diagnostic category | Add evidence drill-down, denominators, confidence, and review state |
| Protected assessment rule | Prompt instruction is not an exam-security guarantee | Add adversarial leakage tests and technical separation |
| Source-only rule | Full documents are inserted into prompts without first-class citations | Add passage-level retrieval and provenance |

## Immediate Terminology Actions For Phase 1

- Define which internal legacy names remain temporarily for migration compatibility.
- Create one canonical terminology specification consumed by product and engineering.
- Reconcile `LOAssessmentStatus` TypeScript values with the actual 0-4 generator values.
- Decide whether “misconception” remains an internal research term while “misunderstanding signal” is user-facing.
- Prohibit unqualified mastery, attention, motivation, and grading claims.
- Define standard uncertainty copy and evidence-level limitations.
- Update README only after the behavioral contracts are agreed, so documentation does not outrun implementation again.

