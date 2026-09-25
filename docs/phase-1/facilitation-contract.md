# AI_demo Facilitation Contract

Contract version: `facilitation-1.0.0`

## Purpose

AI_demo may recommend how much instructor control appears proportionate to observed learning conditions. It must preserve student intellectual ownership and instructor authority.

The framework has three modes:

- Observer
- Guide
- Conductor

No mode is inherently superior. Effective facilitation moves among them as conditions change.

## General Rule

> Intervene just enough to restore or deepen productive learning, then release control again.

AI_demo recommends. The instructor decides.

## Observer

### Definition

The instructor intentionally preserves learner control because productive momentum is evident.

### Minimum Evidence

One or more of:

- Learners are producing a usable claim, decision, or explanation.
- Learners are building on evidence or one another's reasoning.
- Learners are revising ideas without external rescue.
- The intended cognitive work is visibly progressing.

### Typical Move

- Continue observing.
- Collect evidence for later debrief.
- Avoid interrupting productive reasoning.

### Escalation Condition

Move toward Guide when evidence becomes shallow, stalled, concentrated, or uncertain.

## Guide

### Definition

The instructor shapes the reasoning process without supplying the answer.

### Minimum Evidence

One or more of:

- The task is understood but progress has stalled.
- Reasoning is active but shallow.
- A learner or small subset shows confusion.
- No usable claim or decision has emerged.
- Learners need to identify evidence, criteria, contrast, or warrant.

### Permitted Moves

- Ask for current thinking.
- Ask for evidence.
- Narrow the task.
- Add a constraint.
- Ask for a comparison or counterexample.
- Ask learners to state the strongest current claim.
- Broaden participation through an invitation.

### Escalation Condition

Move toward Conductor when:

- Learners cannot state the task or next step.
- The same consequential confusion is widespread.
- A Guide nudge does not restore usable progress.
- Participation remains structurally concentrated after a proportionate invitation.

### Release Condition

Move toward Observer when learners resume substantive, self-sustaining reasoning.

## Conductor

### Definition

The instructor briefly increases control to clarify, reset, structure, or relaunch the learning task.

### Minimum Evidence

One or more of:

- The task itself has broken down.
- Learners cannot identify the key decision or next step.
- A consequential misunderstanding appears across multiple learners or groups.
- Participation structure prevents meaningful contribution.
- Continued individual guidance would be less proportionate than a shared reset.

### Permitted Moves

- Pause the activity.
- Restate the goal and next step.
- Clarify one shared concept.
- Reset participation structure.
- Provide a minimal common frame.
- Relaunch learners into the cognitive work.

### Prohibited Moves

- Complete the intellectual task for learners.
- Deliver an extended answer when a brief reset is sufficient.
- Treat one learner's difficulty as class-wide without evidence.
- Remain in Conductor mode after learners can resume.

### Release Condition

Every Conductor recommendation must specify observable evidence that would justify returning to Guide or Observer.

## Recommended Pivot Structure

```text
id
sessionId
mode                       observer | guide | conductor
scopeType                  learner | group | class
scopeIds[]
triggerSignalIds[]
observedCondition
diagnosisQuestion?
rationale
suggestedMove
suggestedPhrase?
confidenceLevel
limitations
escalationCondition?
releaseCondition
ruleVersion
createdBy                  rule | model | instructor
reviewState
```

## Initial Deterministic Rules

| Observed condition | Default mode | Required qualification |
|---|---|---|
| Usable reasoning is progressing | Observer | No contradictory stall or shared confusion signal |
| Isolated confusion | Guide | Evidence limited to learner/small group scope |
| Active but shallow response | Guide | Ask for evidence, explanation, comparison, or decision |
| No usable output yet | Guide | Learners can still state task/next step |
| Task or next step cannot be stated | Conductor | Confirm through diagnosis question where possible |
| Same consequential misunderstanding across multiple learners/groups | Conductor | Constituent evidence must be inspectable |
| Participation concentrated | Guide first | Conductor only after a nudge fails or structure clearly blocks participation |
| Silence or delay | No automatic mode | Show observation and seek context |

## Diagnosis Before Escalation

Where time permits, AI_demo should suggest a diagnosis question before a stronger intervention.

Examples:

- “What is the next step you are working on?”
- “What have you decided so far?”
- “Which evidence are you using?”
- “Are others encountering the same issue?”
- “What specifically is unclear?”

The answer may change the recommended mode.

## Scope Rules

- Learner-level evidence cannot justify a class-level Conductor move by itself.
- Group-level patterns require evidence from multiple members or an explicit group product.
- Class-level recommendations must include denominator and coverage.
- Lack of data is not evidence of healthy momentum.

## Instructor Control

The instructor can:

- Accept the mode
- Choose another mode
- Edit the phrase or move
- Record the action used
- Record whether momentum improved
- Reject the underlying diagnosis

AI_demo must retain the instructor decision and must not silently regenerate over it.

## Model Use

Initial mode selection must be rule-based.

Models may later:

- Personalize phrasing
- Summarize evidence
- Suggest context-sensitive variants

Models must not independently expand the permitted modes, scope, or intervention authority.

## Evaluation Requirements

Evaluate:

- Instructor agreement with mode
- False escalation to Conductor
- Missed need for reset
- Usefulness of diagnosis questions
- Whether suggested moves restore momentum
- Whether control is released promptly
- Differences across course formats and learner groups

