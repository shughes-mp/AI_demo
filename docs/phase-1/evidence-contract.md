# AI_demo Evidence Contract

Contract version: `evidence-1.0.0`

## Purpose

This contract defines what counts as evidence, how AI_demo may infer from it, how uncertainty is represented, and what instructors must be able to review.

## Epistemic Layers

Every consequential output must preserve five distinct layers.

### 1. Observation

A directly recorded event without educational interpretation.

Examples:

- Learner message text
- Assistant question text
- Source passage text
- Evidence question presented
- Hint rung used
- Response timestamp
- Learner-selected confidence value

### 2. Evidence

One or more stable citations selected as relevant to a claim.

Evidence does not become valid merely because a model selected it. The instructor must be able to inspect it.

### 3. Inference

A provisional interpretation of evidence.

Examples:

- Possible misunderstanding
- Evidence of a learning outcome
- Confidence/explanation mismatch
- Possible need for follow-up

### 4. Recommendation

An optional action derived from an inference.

Examples:

- Ask for source evidence
- Use a Guide move
- Briefly clarify a shared issue

### 5. Decision

An instructor or learner action with authority.

Examples:

- Instructor approves or rejects a signal
- Instructor selects a teaching move
- Learner contests a summary

The UI and data model must not present an inference as an observation or a recommendation as a decision.

## Required Evidence Signal Structure

Each consequential signal must include:

```text
id
signalType
scopeType                 learner | group | class
scopeId
sessionId
claim
status                    provisional | approved | revised | rejected | superseded
confidenceLevel           low | medium | high
confidenceRationale
limitations
missingEvidence
contradictoryEvidence
learningOutcomeIds[]
evidenceQuestionIds[]
citations[]
opportunitySummary
createdAt
createdBy                 model | rule | instructor
modelId?
promptVersion?
parserVersion?
policyVersion
rubricVersion?
supersedesSignalId?
```

## Citation Structure

Each citation must include:

```text
id
signalId
citationType              learner_message | assistant_message | source_passage | process_event
recordId
quotedText
startOffset?
endOffset?
sourceFilename?
passageId?
relevanceRationale
```

Rules:

- Citations must resolve to immutable or versioned content.
- Quoted text is a convenience, not the sole reference.
- Source citations must identify the exact passage, not only the filename.
- Dialogue citations must identify the exact message.
- Process citations may identify hint use, opportunity presentation, revision, or confidence probe.

## Signal Types

Initial permitted signal types:

- `possible_misunderstanding`
- `possible_resolution`
- `learning_outcome_evidence`
- `topic_evidence`
- `confidence_calibration_gap`
- `insufficient_evidence`
- `possible_interaction_concern`
- `source_grounding_gap`
- `transfer_evidence`

New signal types require:

- Defined evidence requirements
- Defined prohibited claims
- Evaluation fixtures
- Governance review
- Versioned policy update

## Opportunity Contract

Evidence cannot be interpreted without knowing what the learner was asked to do.

Each opportunity should record:

- Evidence question
- Target learning outcome or topic
- Cognitive process requested
- Source material available
- Support already provided
- Whether a response was received
- Whether the opportunity was sufficiently distinct from prior opportunities

Evidence level 3 or 4 requires at least two distinct, relevant opportunities unless an instructor explicitly overrides the requirement with rationale.

## Evidence Levels

Evidence levels summarize observed evidence, not learner ability.

### Level 0: No Observed Evidence

- No relevant response or no meaningful opportunity completed.
- Must distinguish no response from incorrect response.

### Level 1: Beginning Evidence

- A relevant attempt exists.
- Reasoning is substantially inaccurate, unsupported, or incomplete.

### Level 2: Developing Evidence

- Some relevant reasoning is accurate.
- Important gaps, inconsistency, support dependence, or unresolved misunderstanding remains.

### Level 3: Proficient Evidence Within Observed Opportunities

- Reasoning is accurate and relevant across at least two distinct opportunities.
- The learner explains or applies the concept with appropriate source grounding.
- No contradictory high-consequence evidence remains unaddressed.

### Level 4: Advanced Evidence Within Observed Opportunities

- Level 3 conditions are met.
- The learner also analyzes, justifies, evaluates limitations, or transfers appropriately in a demanding context.
- Advanced vocabulary or polished writing alone does not qualify.

## Confidence Contract

Confidence describes confidence in the signal, not confidence in the learner.

### Low

- Sparse or ambiguous evidence
- Weak source alignment
- Conflicting evidence
- Classification relies heavily on model interpretation

### Medium

- Relevant evidence exists
- Some ambiguity, missing opportunity, or contradiction remains

### High

- Multiple direct citations converge
- Source relationship is clear
- Opportunity was appropriate
- No material contradictory evidence was found

High model confidence does not remove the need for instructor review.

Learner self-reported confidence must be stored separately from signal confidence.

## Misunderstanding Signal Contract

A possible misunderstanding requires:

- Exact learner claim citation
- Relevant source passage or instructor-defined expectation
- Explanation of the conflict
- Confidence and rationale
- Alternative plausible interpretation where applicable
- Consequence of leaving the issue unresolved

It must not be created for:

- Silence alone
- Confusion about interface instructions
- Concision or non-standard grammar
- Disagreement with an interpretation when the source permits alternatives
- Off-topic remarks without a false content claim

Resolution requires new learner evidence demonstrating corrected understanding. Repeating AI_demo's words is insufficient by itself.

## Interaction Concern Contract

AI_demo may record observations such as:

- No response recorded for a defined period
- Repeated one-word responses
- Repeated response unrelated to the evidence question
- Explicit request to stop

AI_demo must not infer as fact:

- Motivation
- Effort
- Attention
- Hostility as a stable trait
- Need for help based solely on elapsed time

Any `possible_interaction_concern` must show the observation and at least one alternative explanation.

## Aggregation Contract

Class-level patterns must include:

- Number of distinct learners represented
- Total eligible learners
- Number of relevant opportunities
- Reviewed versus unreviewed signal counts
- Confidence distribution
- Contradictory examples
- Stable links to constituent signals

Rules:

- Prevalence is not severity.
- Frequency is not instructional importance.
- Unreviewed signals must not be silently presented as reviewed facts.
- Learner-level evidence must remain accessible under appropriate authorization.

## Review Contract

Consequential signals begin as `provisional`.

Instructor actions:

- Approve
- Revise
- Reject
- Supersede
- Add context

Every action records:

- Actor
- Timestamp
- Previous state
- New state
- Rationale or optional note

AI_demo must never overwrite an instructor decision silently. New model output creates a new version or superseding signal.

## Display Contract

Every consequential signal display must expose:

- Claim
- Provisional/reviewed state
- Evidence citations
- Confidence and rationale
- Opportunity coverage
- Limitations
- Contradictory or missing evidence
- Instructor controls, when authorized

Compact views may summarize these fields but must provide a direct drill-down.

## Grading Boundary

AI_demo does not produce grades.

Evidence levels may inform instructor judgment only when:

- The instructor independently reviews relevant evidence.
- The assessment design permits the use.
- Institutional policy permits the use.
- The learner has appropriate notice and recourse.

Exports must preserve the formative-use statement and review state.

