# AI_demo Terminology Contract

Contract version: `terminology-1.0.0`

## Canonical Terms

| Canonical term | Definition | Use |
|---|---|---|
| AI_demo | The complete AI-assisted teaching, learning, and formative assessment system | Product and learner-facing assistant name |
| Learning session | A configured learner interaction with a defined purpose | General core object |
| Learning evidence session | A learning session explicitly designed to generate formative evidence | Instructor setup and formal documentation |
| Source material | Instructor-provided content used as the evidence base | Uploads, citations, learner explanation |
| Protected assessment material | Instructor-provided prompts or answers that may constrain coaching but must not be disclosed | Assessment-protection workflow |
| Evidence question | A question defining an opportunity for learners to demonstrate reasoning | Formerly checkpoint/key question in visible UI |
| Evidence opportunity | A meaningful chance for a learner to demonstrate an outcome or concept | Evidence-level interpretation |
| Observation | Directly recorded learner or system behavior without interpretation | Evidence pipeline |
| Evidence citation | A stable reference to dialogue, source material, or process event | Provenance and review |
| Formative signal | A provisional, limited inference from evidence | General AI-generated signal |
| Review signal | A signal presented to an instructor for attention | Monitoring |
| Learning outcome evidence | Evidence associated with an instructor-defined learning outcome | Outcome review |
| Evidence level | A bounded summary of observed evidence within presented opportunities | 0-4 formative scale |
| Process evidence | Information about how reasoning unfolded, including prompts, hints, revisions, and opportunities | Outcome and learner review |
| Misunderstanding signal | A provisional inference that a learner's claim may conflict with the source or intended concept | Learner-level record |
| Misunderstanding pattern | A reviewed or provisional grouping of related misunderstanding signals | Class-level review |
| Topic evidence | Observed evidence related to a topic | Visible replacement for topic mastery |
| Evidence map | Purpose-specific class-level synthesis of evidence | Replacement for heatmap |
| Teaching brief | Instructor-facing synthesis of evidence, uncertainty, and suggested teaching moves | Report output |
| Suggested teaching move | Evidence-linked, optional instructional action | Teaching brief |
| Recommended Pivot | A provisional Observer, Guide, or Conductor recommendation | Facilitation intelligence |
| Observer | Preserve learner control because productive momentum is evident | Facilitation mode |
| Guide | Shape reasoning without supplying the answer | Facilitation mode |
| Conductor | Briefly increase instructor control to clarify, reset, or relaunch | Facilitation mode |
| Instructor review state | Provisional, approved, revised, rejected, or superseded | Evidence governance |

## Evidence-Level Language

Preferred labels:

- `0 - No observed evidence`
- `1 - Beginning evidence`
- `2 - Developing evidence`
- `3 - Proficient evidence within observed opportunities`
- `4 - Advanced evidence within observed opportunities`

Display rules:

- Always include “evidence” in the visible label.
- Levels 3 and 4 must include or expose “within observed opportunities.”
- Never display the number alone.
- Never call it a grade, score, mastery level, or learner ability level.
- Always provide evidence citations, opportunity coverage, confidence, and review state.

## Uncertainty Language

Use language proportionate to the evidence:

### Direct Observation

- “The learner wrote...”
- “No response was recorded for three minutes.”
- “Two evidence questions were addressed.”

### Provisional Inference

- “Evidence suggests...”
- “AI_demo identified a possible...”
- “This may indicate...”
- “The available dialogue does not establish...”

### Reviewed Inference

- “Instructor approved...”
- “Instructor revised this signal to...”
- “Instructor rejected this interpretation.”

Avoid:

- Definitely
- Proven
- Precise
- Knows/does not know, without scope
- Is engaged/disengaged, as a stable learner trait
- Mastered

## Deprecated Visible Terms

| Deprecated term | Replacement | Migration treatment |
|---|---|---|
| AI tutor / tutor | AI_demo or guided learning assistant when category is needed | Remove from visible product copy; legacy code names may remain temporarily |
| Session target | Learning cycle purpose | Replace |
| Key question / checkpoint | Evidence question | Keep checkpoint only as temporary internal model name |
| Instructor recommendations | Teaching brief or suggested teaching moves | Replace |
| Action flags | Review signals | Replace |
| Engagement block | Possible interaction concern with observation | Replace and revise behavior |
| Needs help | May need follow-up | Replace |
| On task | No current review signals detected | Replace; do not infer universal on-task state |
| Score | Evidence level | Replace |
| Rubric projection | Learning outcome evidence | Replace |
| Topic mastery | Topic evidence | Replace and migrate behavior |
| Misconception, as definitive user-facing diagnosis | Possible misunderstanding signal | Use “misconception” only when explicitly reviewed or in research/internal migration context |
| Common misunderstandings | Misunderstanding patterns | Replace |
| Heatmap | Evidence map | Replace visibly; parse legacy reports |
| Resolution rate | Resolution signal or reviewed resolution proportion | Qualify denominator and review state |
| Severity | Potential instructional consequence, with rationale | Replace after contract implementation |

## Internal Legacy Names

The following may remain temporarily to preserve compatibility:

- `Session`
- `Checkpoint`
- `LOAssessment`
- `TopicMastery`
- `Misconception`
- `ReadinessHeatmap`
- `/report` routes

Rules for legacy names:

- They must not define new product semantics.
- New APIs should use canonical contract names.
- Compatibility adapters must be explicit.
- Every legacy name must have a migration issue and removal criterion.
- User-visible labels must follow this contract.

## Capitalization And Style

- Product: `AI_demo`
- Sentence case for interface labels
- Use `learner`, not `student`, in product copy unless institution-specific context requires student
- Use `instructor`, not teacher, as the general product role
- Use “AI-generated,” not “AI assessed”
- Use “formative,” not “low stakes,” unless low-stakes use is actually guaranteed
- Avoid anthropomorphic certainty such as “AI_demo knows” or “AI_demo understands”

## Enforcement

Phase 2 should add:

- Shared typed enums and labels
- Automated scans for prohibited visible terms
- Tests for required uncertainty language
- Compatibility mappings for old reports and records
- Documentation linting where practical

