# AI_demo Higher-Rigor Recommendation Set

This document captures the revised, higher-rigor recommendation set for AI_demo: a teaching, learning, and formative assessment system that uses AI to make learner thinking visible while preserving instructor judgment, productive struggle, and source-grounded learning.

The recommendations below assume AI_demo is intended for instructors and learners who need a clear, trustworthy, pedagogically serious tool. The core design principle is conditional AI use: AI_demo should help when it strengthens learning processes, evidence review, feedback, and instructional decision-making; it should avoid becoming a shortcut, answer engine, proxy assessor, or false-precision dashboard.

## Executive Summary

AI_demo should be designed as a formative learning evidence system, not simply an AI tutor.

Its value proposition should be:

- For instructors: create source-grounded learning sessions, see evidence of learner reasoning, identify misunderstanding patterns, and plan better teaching moves.
- For learners: receive guided questioning that supports explanation, retrieval, transfer, and metacognitive reflection without simply supplying answers.
- For assessment: generate formative signals from learner dialogue that instructors can review, not automated grades or claims of mastery.

The app should communicate and implement a coherent loop:

1. Instructor defines the learning purpose, source materials, learning outcomes, and protected assessment materials.
2. Learner engages in guided dialogue that asks for reasoning, evidence, explanation, and reflection.
3. AI_demo analyzes the dialogue for evidence of understanding, misconception patterns, confidence gaps, and outcome-related reasoning.
4. Instructor receives a teaching brief and learner progress signals to guide follow-up instruction.
5. The system makes clear that all AI outputs are formative, provisional, source-grounded, and instructor-reviewed.

## Product Positioning

### Recommendation

Position AI_demo as an AI-assisted teaching, learning, and formative assessment system.

Avoid framing it primarily as:

- An "AI tutor"
- A grading tool
- A mastery detector
- A replacement for instructor judgment
- A generic chatbot for students

Preferred framing:

- AI_demo helps instructors turn learner dialogue into formative evidence.
- AI_demo supports learners through guided questioning and explanation.
- AI_demo helps instructors see reasoning, not just answers.
- AI_demo produces reviewable teaching intelligence, not automated grades.

### Rationale

The strongest research-informed design stance is not "AI improves learning" in general. It is: AI can improve learning when it is pedagogically constrained, source-grounded, process-oriented, and embedded in human instructional judgment. AI_demo should make those constraints obvious in the product itself.

## Core Terminology System

Use a consistent vocabulary across README, UI, generated reports, and prompts.

### Preferred Terms

- Product name: `AI_demo`
- Core object: `learning session` or `learning evidence session`
- Learner-facing AI: `AI_demo`
- Instructor output: `teaching brief`
- Monitoring output: `review signals`
- Assessment output: `learning outcome evidence`
- Misconception output: `misunderstanding patterns`
- Heatmap-style output: `evidence map`
- Learner data: `evidence of thinking`, `learner reasoning`, `dialogue evidence`
- AI assessment language: `formative signals`, `reviewable evidence`, `observed evidence`

### Terms To Avoid Or Use Carefully

- Avoid: `score`, unless explicitly qualified as a formative evidence level.
- Avoid: `mastery`, unless used as a legacy internal implementation term or carefully contextualized.
- Avoid: `on task`, because it implies unwarranted certainty.
- Avoid: `precision`, because the app should not imply false accuracy.
- Avoid: `rubric projection`, because it sounds like a predictive grade.
- Avoid: `AI tutor` as the main product category, because it narrows the app and underplays teaching and assessment.
- Avoid: `assessment` when the intended meaning is formative evidence, unless explicitly clarified.

## Landing Page

### Current Problem

A naive reader needs to understand, within seconds:

- What AI_demo is
- Who it is for
- What problem it solves
- What happens in a session
- Why the AI is pedagogically safe and useful
- What the instructor receives afterward

If the landing page frames the product as a "Socratic AI tutor," it undersells the broader teaching, learning, and assessment loop.

### Recommended Changes

The landing page should say that AI_demo helps instructors turn learner dialogue into formative evidence before, during, or after class.

The first-view message should communicate:

- AI_demo is for instructors.
- Learners join with a code.
- AI_demo asks guided questions.
- Learners explain their thinking.
- Instructors receive a teaching brief and review signals.
- AI output is formative and instructor-reviewed.

Recommended headline:

> Evidence-led teaching for every stage of the learning cycle.

Recommended supporting copy:

> AI_demo helps instructors turn learner dialogue into formative evidence before, during, or after class, without replacing instructor judgment.

Recommended capability labels:

- Teaching Intelligence
- Misunderstanding Signals
- Learning Outcome Evidence

Recommended how-it-works steps:

1. Set the learning purpose.
2. Make thinking visible.
3. Review formative evidence.

## Instructor Session Creation

### Current Problem

If session creation says "Set up your AI Tutor," it primes instructors to think they are configuring a chatbot rather than designing a learning evidence experience.

### Recommended Changes

Rename the setup concept:

- From: `Set up your AI Tutor`
- To: `Set up a learning evidence session`

Use language that previews the full workflow:

- Upload source materials.
- Define learning outcomes.
- Protect assessment materials.
- Choose when learners will use AI_demo.
- Generate formative evidence for review.

Recommended field label:

- From: `Session Name`
- To: `Learning session name`

Recommended CTA:

- From: `Create session`
- To: `Create learning session`

## Instructor Workspace

### Current Problem

The workspace is the product's design cockpit. It should not feel like a generic file upload and tutor setup flow. It should teach instructors how to create a constrained, evidence-generating learning experience.

### Recommended Changes

Rename setup steps:

- `Purpose & Outcomes`
- `Source Materials`
- `Evidence Questions`
- `Learner Link`

Reframe the status bar:

- From generic setup status
- To a concise summary of evidence readiness:
  - number of source materials
  - number of evidence questions
  - number of protected assessments
  - AI_demo purpose

Clarify source materials:

- AI_demo uses uploaded sources as its evidence base.
- Claims should be grounded in instructor-provided materials.
- Learners should understand that AI_demo is not drawing from arbitrary outside knowledge.

Clarify evidence questions:

- Questions are not simply prompts for conversation.
- They define what evidence AI_demo should listen for.
- They should require interpretation, inference, synthesis, explanation, or transfer.
- They should avoid simple recall.

Clarify protected assessment materials:

- Assessment prompts may be uploaded for coaching constraints.
- AI_demo should help learners reason without revealing protected answers.
- The UI should make that protection explicit.

## Teaching Context

### Current Problem

Teaching context can look optional in a shallow way, when it is actually central to making the AI pedagogically calibrated.

### Recommended Changes

Clarify that course context helps AI_demo connect the session to:

- Larger course themes
- Prior learning
- Relevant vocabulary
- Instructor goals
- Level of learner expertise

Rename `Tutor stance` to `Interaction style`.

Interaction styles should be explained as:

- Directed: clear authority, more structured guidance.
- Mentor: more collaborative inquiry for experienced or professional learners.

Clarify the foundational concept map:

- It is not a "mastery" map.
- It identifies concepts learners need in order to reason well with the material.
- It helps AI_demo notice confidence that is not yet backed by explanation.

## Learner Entry Page

### Current Problem

Learners need clear expectations before starting. They should know AI_demo will not simply provide answers, but the message should not feel punitive or surveillance-oriented.

### Recommended Changes

The learner entry page should explain:

- Start by saying what you already understand.
- AI_demo will ask follow-up questions.
- AI_demo will ask for reasoning and evidence.
- AI_demo will not simply hand over answers.
- The instructor may review the conversation as formative evidence.
- Thoughtful reasoning matters more than speed.

Recommended learner-facing bullets:

- Start by explaining what you already know about this topic, in your own words.
- AI_demo will ask follow-up questions to deepen your thinking. It will not simply hand you the answers.
- Your instructor may review the conversation as formative evidence of your reasoning.
- Take your time. Thoughtful reasoning matters more than speed.

## Learner Chat

### Current Problem

Learners can easily misunderstand the AI as a chatbot, answer machine, or hidden grader. The chat interface must frame the interaction as guided reasoning.

### Recommended Changes

The chat orientation should say:

- AI_demo asks questions.
- AI_demo looks for evidence in reasoning.
- AI_demo stays grounded in instructor-provided materials.
- Learners should explain thinking before asking for help.

Avoid visible countdown pressure such as `x / y exchanges` as the main label. Use `Session progress` while preserving the exact count in tooltip or secondary text.

Rename final phase:

- From: `Final thoughts`
- To: `Synthesis`

Clarify session ending:

- The system prepares a formative session summary.
- The summary is AI-generated and may be incomplete.
- It is a starting point, not a full record.

## Learner Summary

### Current Problem

If the summary says "before class," it assumes a pre-class workflow and does not match during-class or after-class sessions.

### Recommended Changes

Use purpose-neutral language:

- From: `Save or share this with your instructor before class.`
- To: `Save or share this with your instructor for formative review.`

Prompt the AI-generated summary to include:

- Topics covered
- Where you showed strong understanding
- What's worth revisiting
- A question to carry forward

Avoid assuming the next use is class. Use "next learning moment."

## Instructor Monitoring

### Current Problem

Monitoring language can easily overstate certainty. Phrases like "All learners are on task," "Needs help," "Engagement block," and "Rubric projection" imply a level of behavioral and assessment certainty the system does not have.

### Recommended Changes

Use softer, review-oriented language:

- From: `Real-time monitoring`
- To: `Live review signals`

- From: `All learners are on task`
- To: `No current review signals detected`

- From: `Action Flags`
- To: `Review signals`

- From: `Needs help`
- To: `May need follow-up`

- From: `Engagement block`
- To: `Possible engagement concern`

- From: `Rubric projection`
- To: `Outcome evidence`

- From: `Score: 3 / 4`
- To: `Evidence: 3 / 4`

- From: `Topic mastery`
- To: `Topic evidence`

The monitoring surface should help instructors decide where to look, not claim to know learner states with certainty.

## Teaching Brief

### Current Problem

If the report is framed as "Instructor recommendations," the output may feel like generic advice. If it is framed as an assessment report, it may feel over-authoritative.

### Recommended Changes

Use `Teaching brief` as the main report frame.

The teaching brief should include:

- Session snapshot
- Suggested teaching moves
- Evidence map
- What the evidence suggests students can build on
- Where the evidence suggests follow-up
- Per-student notes
- Learning outcome evidence

The brief should repeatedly connect recommendations to evidence from learner dialogue.

The brief should state that AI outputs are:

- Formative
- AI-generated
- Based on observed dialogue
- Instructor-reviewed
- Not summative grades

## Evidence Maps

### Current Problem

Heatmaps can imply precision, measurement, and stable categorization. That is risky for learning evidence derived from dialogue.

### Recommended Changes

Rename heatmaps:

- `Readiness Evidence Map`
- `Activation Evidence Map`
- `Consolidation Evidence Map`
- `Transfer Evidence Map`

Rename map labels:

- From: `Ready for class`
- To: `Evidence suggests ready`

- From: `Gaps remain`
- To: `Evidence suggests gaps`

- From: `Not yet ready`
- To: `Evidence suggests review`

The map should be treated as a review tool, not a diagnostic verdict.

## Misunderstanding Patterns

### Current Problem

The phrase "Common misunderstandings" is useful, but it can sound like a final diagnosis. The app should make clear that these are patterns found in learner dialogue.

### Recommended Changes

Rename:

- From: `Common misunderstandings`
- To: `Misunderstanding patterns`

Describe the page as:

> Review patterns AI_demo found in learner dialogue, decide which need class discussion, and turn them into active learning moves.

Rename metrics:

- From: `Logged misconceptions`
- To: `Logged misunderstanding signals`

- From: `Resolution rate`
- To: `Resolution signal`

- From: `Top misconception clusters`
- To: `Top misunderstanding patterns`

Rename controls:

- From: `Acceptable interpretation`
- To: `Mark as acceptable`

- From: `Needs class discussion`
- To: `Flag for class discussion`

- From: `Expand details`
- To: `Review evidence`

## Learning Outcome Evidence

### Current Problem

The app currently has rubric-like assessment signals. That can be useful, but the language must prevent these from being interpreted as grades.

### Recommended Changes

Use `Evidence level` rather than `Score`.

Recommended labels:

- `Evidence level: 0 / 4 (No Submission)`
- `Evidence level: 1 / 4 (Beginning)`
- `Evidence level: 2 / 4 (Developing)`
- `Evidence level: 3 / 4 (Proficient)`
- `Evidence level: 4 / 4 (Advanced)`

Every learning outcome evidence display should include:

- Evidence summary
- Confidence level
- Process evidence
- Misunderstanding signals
- Questions addressed
- Highest hint rung used, if relevant

The UI should make clear:

- Evidence levels are formative.
- They are based only on observed dialogue.
- They are not complete measures of learner ability.
- Instructor review is required before grading decisions.

## Generated Report Prompt

### Current Problem

Even if the UI is revised, generated reports can reintroduce old language such as "mastery," "score," "readiness heatmap," or "what to do next."

### Recommended Changes

The report generator should produce:

- Teaching briefs from AI_demo learning sessions.
- Suggested teaching moves, not generic recommendations.
- Evidence maps, not heatmaps.
- Learning outcome evidence, not learning outcome assessment as a final judgment.
- Evidence-grounded claims, not broad claims about learner ability.

The prompt should instruct the model to:

- Tie every recommendation to actual dialogue evidence.
- Avoid generic advice.
- Distinguish resolved from unresolved misunderstanding signals.
- Use brief representative quotes only when helpful.
- Keep the main brief concise.
- Emit structured learning outcome evidence tags separately.
- Treat output as formative and instructor-facing.

## Product Safety And Trust Principles

### Recommendation

AI_demo should make its guardrails visible and operational.

The system should communicate:

- AI_demo uses instructor-provided sources.
- AI_demo does not reveal protected assessment answers.
- AI_demo asks for learner reasoning.
- AI_demo output is AI-generated and may be incomplete.
- AI_demo supports instructor judgment rather than replacing it.

### Design Implications

Include visible reminders in learner and instructor interfaces:

- Source grounding
- Formative use
- Instructor review
- Productive struggle
- Assessment protection

Avoid any feature that implies:

- Fully automated grading
- Complete learner diagnosis
- Certainty about attention or motivation
- General intelligence measurement
- Replacement of teacher expertise

## Pedagogical Design Principles

AI_demo should implement the following learning principles:

1. Productive struggle
   - Learners should explain, revise, and reason before receiving direct help.

2. Retrieval and self-explanation
   - Sessions should ask learners to recall, explain, and connect concepts.

3. Source-grounded reasoning
   - Learner claims should be connected to uploaded materials.

4. Misconception repair
   - AI_demo should identify possible misunderstanding patterns and guide learners toward correction.

5. Confidence calibration
   - AI_demo should surface gaps between confidence and demonstrated explanation.

6. Transfer
   - After-class sessions should ask learners to apply ideas in new contexts.

7. Instructor review
   - The system should make evidence inspectable and actionable for instructors.

## Facilitation Agility: Observer, Guide, Conductor

### Relevance To AI_demo

The Observer / Guide / Conductor framework is highly relevant to AI_demo because it gives the product a more rigorous theory of instructor action.

AI_demo should not only help instructors identify learner misunderstandings or generate teaching briefs. It should help instructors decide:

- How much to intervene
- When to intervene
- Whether to preserve student control
- Whether to guide student reasoning
- Whether to briefly take more instructor control and reset the task

This framework fits AI_demo's core purpose because effective active learning depends on maintaining the right balance between instructor direction and student thinking. The goal is not for the instructor or AI to do the thinking for learners. The goal is to structure conditions so learners do cognitive work: interpreting evidence, evaluating arguments, testing ideas, making decisions, and revising their understanding.

### Core Insight

The material adds a missing instructional decision layer to AI_demo.

AI_demo already asks:

> What evidence of learner thinking appeared in the dialogue?

The Observer / Guide / Conductor framework adds:

> Given that evidence, what facilitation stance should the instructor take next?

That is a major improvement because it moves AI_demo from evidence reporting toward proportionate instructional action.

### The Three Facilitation Modes

#### Observer

Observer mode means the instructor intentionally stays out of the way so learners can sustain learning momentum on their own.

This is not disengagement. It is an active instructional choice.

Observer mode is appropriate when:

- Learners are actively exchanging ideas.
- Learners are building on one another's reasoning.
- Learners are producing usable responses or decisions.
- Learner-led momentum is healthy.
- Instructor intervention might unnecessarily recenter the thinking on the instructor.

AI_demo should recommend Observer mode when evidence suggests learner thinking is advancing well and the instructor should preserve student control.

#### Guide

Guide mode means the instructor shapes the process of reasoning without supplying answers.

The instructor remains visibly involved, but the students still do the intellectual work.

Guide mode is appropriate when:

- Learners understand the task but are not making progress.
- Discussion is active but shallow.
- Learners need help focusing on evidence.
- Learners need a constraint, prompt, or narrowing question.
- Confusion is present but isolated.
- Learners need help converging on a claim, decision, or line of reasoning.

AI_demo should recommend Guide mode when learners need a nudge that preserves student ownership.

#### Conductor

Conductor mode means the instructor purposefully increases control to refocus attention, clarify the task, or reset the learning activity.

Conductor mode is appropriate when:

- The task itself has broken down.
- Learners cannot describe the next step.
- Confusion is widespread.
- The same misunderstanding appears across several groups or responses.
- Participation structures need to be reset.
- The class needs a short clarification before student work can continue productively.

AI_demo should recommend Conductor mode when evidence suggests a proportionate instructor reset would restore momentum more effectively than continued individual guidance.

### Current Status In AI_demo

This framework is only partially present right now.

Currently present:

- AI_demo identifies misunderstanding patterns.
- AI_demo flags possible engagement concerns.
- AI_demo produces teaching briefs and suggested teaching moves.
- AI_demo supports different learning-cycle moments: pre-class, in-class prep, in-class reflection, and after-class transfer.
- AI_demo's learner interaction model already resembles Guide mode because it asks questions rather than simply supplying answers.
- Some Conductor-like logic is implicit when the app recommends instructor follow-up for widespread misunderstanding.

Currently absent:

- AI_demo does not explicitly name Observer, Guide, or Conductor modes.
- AI_demo does not yet map evidence signals to facilitation modes.
- AI_demo does not distinguish "stay out of the way" from "guide with a question" from "pause and reset."
- AI_demo does not yet help instructors decide how much control to take in response to changing learning conditions.
- AI_demo does not yet help instructors anticipate likely pivot points before class.

### Recommended Product Integration

Add a new instructor-facing layer called one of:

- `Recommended Pivot`
- `Facilitation Mode`
- `Instructor Move`
- `Control Balance`
- `Next Facilitation Stance`

This layer should appear in:

- Live review signals
- Teaching briefs
- Misunderstanding pattern pages
- Session planning workflow
- In-class prep and reflection modes

For each important signal, AI_demo should recommend a facilitation stance and a proportionate move.

### Signal-To-Pivot Logic

AI_demo should use a structure like this:

| Evidence signal | Likely diagnosis | Suggested mode | Example instructor move |
|---|---|---|---|
| Learners are building on one another's reasoning | Student-led momentum is healthy | Observer | Stay out, collect evidence, and debrief later |
| Learners appear unsure how to proceed | Task may be unclear or progress has stalled | Guide or Conductor | Ask "What is the next step you are working on?" If they cannot answer, briefly reset the task |
| Learners are engaged but have no clear position yet | No usable output for debrief | Guide | Ask "What have you decided so far?" or "Which option are you leaning toward?" |
| Same confusion appears across several learners or groups | Confusion is widespread | Conductor | Pause and clarify the shared issue for the whole class |
| Confusion appears isolated | One learner or group needs support | Guide | Ask what evidence they are using and help them test the interpretation |
| Participation is concentrated in a few voices | Thinking may be uneven or invisible | Guide, then Conductor if needed | Invite quieter voices; if needed, reset participation structure |
| Learners are active but reasoning is shallow | Energy is high but cognitive depth is low | Guide | Add a constraint: require evidence, comparison, justification, or counterargument |
| Learners cannot describe the key decision | Task purpose has broken down | Conductor | Pause and restate the goal, decision point, and next step |

### Example AI_demo Outputs

Instead of saying:

> Review concept X in class.

AI_demo should say:

> Recommended pivot: Conductor. The same misunderstanding appeared across multiple learners, so a brief whole-class reset is likely more efficient than continued individual questioning.

Instead of saying:

> Students are doing well.

AI_demo should say:

> Recommended pivot: Observer. Learners are producing usable reasoning and building on the evidence. Additional intervention may unnecessarily recenter the thinking on the instructor.

Instead of saying:

> Participation is uneven.

AI_demo should say:

> Recommended pivot: Guide, with possible Conductor reset. First invite quieter voices into the reasoning. If participation remains concentrated, briefly reset the structure: each group chooses someone who has not spoken to summarize the group's reasoning.

### Planning Use Case

AI_demo should also support pre-class anticipation of pivot points.

Before launching a session, AI_demo could prompt instructors to identify:

- Where the task may become unclear
- Where learners are likely to stall
- Which concepts are likely to generate widespread confusion
- What usable output the instructor needs for debrief
- Which participation patterns may need attention
- What quick Guide or Conductor phrases the instructor wants ready

This would reduce instructor decision fatigue during live active learning.

Recommended planning feature:

> Anticipated Pivot Points

For each learning session, AI_demo could generate:

- Likely wobble points
- What to watch for
- Suggested diagnosis question
- Recommended pivot mode
- A ready-to-use instructor phrase

### Design Principle

AI_demo should help instructors intervene with speed and proportion.

The standard should be:

- Intervene just enough to restore momentum.
- Preserve student thinking whenever possible.
- Increase instructor control only when conditions require it.
- Release control again as soon as learners can resume the work.

This framework would make AI_demo's teaching recommendations much more precise, practical, and pedagogically grounded.

## Feature Recommendations

### High Priority

- Implement consistent AI_demo terminology across the app.
- Reframe all reports as teaching briefs.
- Replace score/mastery language with evidence language.
- Rename heatmaps to evidence maps.
- Add explicit formative-use language to learner summaries and instructor reports.
- Clarify that learner conversations are grounded in uploaded source materials.
- Clarify that protected assessment materials are not revealed to learners.
- Update generated report prompts to match the revised philosophy.
- Add Observer / Guide / Conductor facilitation modes to teaching briefs and live review signals.
- Map evidence patterns to recommended instructor pivots.

### Medium Priority

- Add "How to read this brief" guidance to instructor reports.
- Add instructor override notes for misunderstanding patterns.
- Add evidence excerpts beside each major AI-generated signal.
- Add confidence indicators that explain what confidence means.
- Add filters by learning outcome, evidence strength, unresolved signal, and learner.
- Add a session preview so instructors can see what learners will experience.
- Add anticipated pivot points to session planning.
- Add ready-to-use Guide and Conductor phrases tied to likely learner signals.

### Longer-Term

- Add instructor calibration workflows where instructors can approve, revise, or reject AI-generated evidence signals.
- Add comparison across multiple sessions to identify persistent patterns.
- Add exportable teaching briefs with explicit formative-use disclaimers.
- Add learner reflection prompts after summary generation.
- Add local evaluation metrics so instructors can judge whether AI_demo improved teaching decisions.
- Add governance controls for data retention, privacy, and institutional review.

## Evaluation Rubric For AI_demo Quality

AI_demo should be evaluated against the following dimensions.

### 1. Purpose Clarity

Perfect score means a naive reader immediately understands that AI_demo supports teaching, learning, and formative assessment through guided learner dialogue and instructor-reviewed evidence.

### 2. Pedagogical Integrity

Perfect score means the app supports productive struggle, reasoning, source grounding, explanation, retrieval, transfer, and misconception repair.

### 3. Learner Calibration

Perfect score means learners understand what AI_demo will and will not do, feel supported rather than judged, and know that thoughtful reasoning matters more than speed.

### 4. Instructor Calibration

Perfect score means instructors understand how to design a session, interpret evidence, and use the teaching brief without mistaking AI output for ground truth.

### 5. Assessment Validity

Perfect score means all assessment-like outputs are clearly framed as formative evidence, not summative scores or automated grades.

### 6. Trust And Safety

Perfect score means source grounding, protected assessment handling, instructor review, and AI limitations are visible and operational.

### 7. Terminology Consistency

Perfect score means the app uses a coherent vocabulary everywhere: README, UI, prompts, reports, learner pages, instructor pages, and exports.

### 8. Actionability

Perfect score means instructors can move from evidence to concrete teaching decisions quickly.

### 9. Naive Reader Accessibility

Perfect score means a first-time user can understand the app without background knowledge in AI, assessment design, or learning science.

### 10. Research Alignment

Perfect score means the app reflects a conditional, evidence-aware view of AI: helpful when constrained and process-oriented; risky when used as a shortcut, proxy, or automated judge.

## Implementation Checklist

- [x] Rename product-facing copy to AI_demo.
- [x] Reframe landing page around teaching, learning, and formative evidence.
- [x] Rename setup flow to learning evidence session.
- [x] Clarify source materials as evidence grounding.
- [x] Clarify evidence questions.
- [x] Clarify protected assessment materials.
- [x] Revise learner entry expectations.
- [x] Revise learner chat framing.
- [x] Revise learner summary prompt and copy.
- [x] Rename monitoring language to review signals.
- [x] Replace score language with evidence language.
- [x] Replace mastery language in visible UI with topic evidence.
- [x] Rename instructor report to teaching brief.
- [x] Rename heatmaps to evidence maps.
- [x] Rename misconception pages to misunderstanding patterns.
- [x] Update generated report prompt to match the revised philosophy.
- [ ] Add "How to read this brief" guidance.
- [ ] Add explicit evidence excerpts beside every major signal.
- [ ] Add instructor override/review workflow for AI signals.
- [ ] Add learner reflection after summary.
- [ ] Add privacy/data governance language in-app.
- [ ] Add evaluation workflow for whether AI_demo improves teaching decisions.
- [ ] Add Observer / Guide / Conductor as an explicit facilitation framework.
- [ ] Add recommended pivot labels to live review signals.
- [ ] Add facilitation-mode recommendations to teaching briefs.
- [ ] Add anticipated pivot-point planning before sessions.
- [ ] Add ready-to-use instructor phrases for common pivots.

## Final Product Standard

AI_demo should feel like a serious instructional instrument:

- Clear enough for a naive reader.
- Rigorous enough for an educator.
- Supportive enough for a learner.
- Careful enough for assessment contexts.
- Honest enough about AI limitations.

The app should never imply that AI knows the learner better than the instructor does. Its role is to make learner thinking more visible, organize evidence, and help instructors act with better information.
