# Phase 4: Learner Learning Experience

Status: **Complete (2026-06-19).**

## Learner orientation

- The learner entry page explains what AI_demo is, the role of instructor-provided materials, the source-first use of broader context, and the expectation that learners explain their thinking.
- It states that the conversation may be reviewed formatively, is not hidden automated grading, and values thoughtful reasoning over speed.
- It warns that AI-generated summaries may be incomplete or inaccurate and tells learners they can add their own reflection or correction.
- The same essentials remain available from the expandable orientation panel during chat.

## Productive struggle

- Tutor support now follows one explicit eight-step ladder: current thinking, evidence, narrowing, constraint or comparison, hint, limited modeling, direct clarification, then learner restatement or application.
- Repeated help requests advance the learner through the ladder instead of restarting it or immediately becoming an answer request.
- Very short responses receive a smaller concrete question without an inference about motivation.
- Long but superficial responses are narrowed to one claim and its evidence or reasoning.
- A direct clarification moves the next turn to restatement or application so receiving an answer does not end the cognitive work.

## Purpose-aware learning behavior

- Pre-class sessions emphasize comprehension, textual accuracy, misconception repair, and readiness.
- In-class preparation emphasizes retrieval and activation.
- In-class reflection emphasizes consolidation and self-explanation.
- After-class sessions emphasize far transfer, application, prediction, and critique.
- Existing confidence checks keep uncertain learners on the same topic and test high confidence with a transfer probe.
- Source grounding and protected-assessment enforcement from Phase 3 remain active.

## Summary and learner reflection

- End-of-session summaries are explicitly descriptive and formative, not grades, scores, mastery judgments, or predictions.
- Summaries include topics covered, where reasoning became clearer, what may be worth revisiting, a question to carry forward, and an explicit AI limitation statement.
- Learners can optionally record what changed, a claim they can now support, remaining uncertainty, and a next step.
- Learners can annotate the summary and explicitly mark it inaccurate or incomplete.
- Reflections and corrections are capability-protected, length-limited, stored additively on the learner session, and available to subsequent instructor reporting as learner-authored context rather than verified evidence.

## Data and compatibility

- The Phase 4 migration only adds nullable reflection fields, one boolean flag, and a submission timestamp to `StudentSession`.
- Existing sessions and summaries remain readable.
- The Turso bootstrap and upgrade path contain matching additive columns.

## Verification

- Automated tests cover the eight-step ladder, direct-answer progression, repeated help requests, short responses, long superficial responses, confidence calibration, purpose-aware behavior, formative and contestable summaries, reflection normalization, endpoint authorization, and additive migration safety.
- The existing source-grounding, protected-answer, evidence, migration, and authorization tests continue to pass.
- ESLint, TypeScript, Prisma generation, migration deployment, Git whitespace validation, and the Next.js production build pass.
- Browser verification confirms meaningful learner orientation at desktop and 390px mobile widths, no horizontal overflow, no framework error overlay, and no browser errors. A live local API transaction confirms capability-protected reflection submission, contested-summary persistence, and cleanup of the temporary fixture.

## Acceptance gate

**Passed.** Learner dialogue asks for cognitive work, repeated help escalates proportionately, purpose changes the learning behavior, summaries communicate their limits, and learners can add or contest the record before formative instructor review.
