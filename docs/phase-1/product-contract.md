# AI_demo Product Contract

Contract version: `product-1.0.0`

## Product Definition

AI_demo is an AI-assisted teaching, learning, and formative assessment system for source-grounded learning sessions.

It helps:

- Learners perform cognitive work through retrieval, interpretation, evidence use, explanation, revision, evaluation, and transfer.
- Instructors inspect evidence of learner thinking, review provisional AI inferences, identify patterns, and choose proportionate teaching moves.
- Educational programmes use formative evidence responsibly without converting AI output into an automated grade, diagnosis, or claim of general ability.

AI_demo is not merely a chatbot or AI tutor. It is a human-governed learning evidence system.

## Primary Users

### Instructor

The instructor:

- Owns and configures learning sessions.
- Selects source and protected assessment materials.
- Defines learning outcomes and evidence questions.
- Reviews AI-generated signals.
- Approves, revises, or rejects consequential inferences.
- Decides whether and how to intervene.
- Remains responsible for grading and instructional decisions.

### Learner

The learner:

- Engages in guided, source-grounded dialogue.
- Explains and revises their thinking.
- Receives proportionate support rather than immediate answer substitution.
- Receives a formative summary and opportunity to reflect or contest it.
- Is told what data is collected and how it may be reviewed.

### Institutional Administrator

An institutional administrator may:

- Configure identity, access, retention, model/provider, and feature policies.
- Audit appropriate use.
- Disable unsupported or experimental inference features.

This role is required for governed deployment but is not yet implemented.

## Supported Product Uses

AI_demo may support:

- Pre-class readiness evidence
- During-class retrieval and activation
- During-class reflection and consolidation
- After-class application and transfer
- Formative misunderstanding identification
- Confidence calibration
- Learning outcome evidence within observed opportunities
- Instructor teaching briefs
- Live review signals
- Instructor-reviewed teaching recommendations
- Observer, Guide, and Conductor pivot recommendations
- Learner formative summaries and reflections

## Prohibited Or Unsupported Uses

AI_demo must not be presented or used as:

- A fully automated grading system
- A sole basis for high-stakes educational decisions
- A measure of general intelligence, motivation, effort, attention, or character
- A complete diagnosis of learner ability or understanding
- A formal exam-security system
- A replacement for instructor review
- A hidden learner-surveillance system
- A mechanism for training external models on learner data without explicit authority

If an institution chooses to use reviewed evidence as one input to grading, the instructor must independently evaluate it under an institutionally approved assessment design. AI_demo itself does not assign the grade.

## Product Claims

### Permitted Claims

AI_demo may say:

- “The learner wrote...”
- “The dialogue contains evidence that...”
- “Evidence within this session suggests...”
- “AI_demo identified a possible misunderstanding...”
- “This signal may warrant instructor review...”
- “A Guide move may be proportionate because...”
- “The instructor approved/revised/rejected this signal.”

### Prohibited Claims Without Additional Evidence

AI_demo must not say:

- “The learner has mastered...”
- “The learner is disengaged/lazy/unmotivated.”
- “The learner is not paying attention.”
- “The class definitely understands...”
- “This score represents the learner's ability.”
- “This intervention will improve learning.”
- “The learner cheated.”

## Authority Model

AI_demo may observe, organize, infer, and recommend. It does not decide.

Authority is allocated as follows:

| Action | AI_demo | Instructor | Learner |
|---|---|---|---|
| Record dialogue | Yes, with disclosure | Governs session | Participates |
| Identify provisional signal | Yes | Reviews | May contest where exposed |
| Approve educational interpretation | No | Yes | May add context |
| Recommend teaching move | Yes, provisionally | Selects/changes | Not applicable |
| Assign grade | No | Yes, under approved process | Receives/appeals under policy |
| Determine retention/access | No | Within institutional policy | Has stated rights |
| Reveal protected answer | No | Controls material | No automatic access |

## Core Operating Loop

1. Instructor establishes purpose and evidence opportunities.
2. AI_demo explains the session and data use to the learner.
3. Learner performs the intellectual work.
4. AI_demo provides graduated support.
5. AI_demo records observations and evidence citations.
6. AI_demo creates provisional inferences with uncertainty.
7. Instructor reviews consequential signals.
8. AI_demo synthesizes reviewed and unreviewed evidence distinctly.
9. Instructor chooses a teaching response.
10. Learner receives a formative summary and reflection opportunity.

## Pedagogical Commitments

AI_demo must prioritize:

- Productive struggle without abandonment
- Source-grounded reasoning
- Retrieval and self-explanation
- Accurate correction of misunderstandings
- Confidence calibration
- Transfer appropriate to the session purpose
- Proportionate support
- Student intellectual ownership
- Instructor authority

The system must avoid both extremes:

- Excessive intervention that recentres thinking on AI or instructor
- Insufficient support that allows confusion or superficial reasoning to persist

## Product Success Criteria

AI_demo succeeds only if:

- Naive users understand its purpose and limitations.
- Learners perform more reasoning rather than outsource it.
- Instructors can inspect and correct consequential signals.
- Teaching recommendations are evidence-linked and usable.
- Source grounding is measurable.
- Protected material leakage is acceptably controlled.
- Workload remains proportionate to instructional value.
- Performance is evaluated across learner groups and communication styles.
- Real instructional decisions improve, not merely dashboard activity.

## Release Constraints

Before real educational deployment involving identifiable learner data, AI_demo requires:

- Instructor identity and session ownership
- Authorization for all instructor and learner records
- Learner disclosure
- Retention and deletion controls
- Evidence provenance
- Instructor review workflow
- Protected-material leakage testing
- Behavioral and adversarial test coverage

