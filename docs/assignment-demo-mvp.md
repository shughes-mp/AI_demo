# Assignment Demo MVP

## Purpose

`/demo` is a focused, no-login colleague preview of AI_thena supporting an
assignment over time. The interactive route uses the real AI_thena model,
source-grounding, protected-assessment, adaptive-support, diagnostic, and
reporting paths. When the model is not configured, it says so explicitly and
offers a separately labelled pre-recorded example; it never substitutes a
scripted reply while presenting it as AI. It never claims that one interaction
establishes authentic or durable student growth.

The landing view immediately establishes the course, assignment, learner role,
choice of system, learning outcomes, and AI boundary. A compact three-step
journey—experience as learner, inspect as instructor, and reflect as colleague—
replaces the earlier locked navigation table. Each view is reachable without
an account, while the primary calls to action preserve the intended story.

The live learner begins without a predetermined system. AI_thena first routes
them toward assignment orientation, foundational concepts and skills, system
selection, or critique of work already in progress. A learner may choose any
suitable system or explicitly opt into the New York City subway as a guided
sample. The persistent assignment companion shows the current stage and system,
the complete assessed-skill map, core concepts, submission constraints, and a
prominent route to the full assignment and all four 0–5 rubrics.

## Learning design

The reusable interaction spine is:

1. **Commit:** preserve an independent baseline before AI support.
2. **Coach:** ask, narrow, hint, or model one analogous reasoning move without
   completing the target work.
3. **Revise:** preserve artifact versions and record whether the learner
   accepted, adapted, or rejected a suggestion.
4. **Reapply:** provide a changed-context task after support fades.
5. **Review:** separate direct observations, provisional inferences,
   recommendations, and instructor decisions.
6. **Evaluate:** ask a colleague to rate learner ownership, learning value,
   evidence credibility, recommendation usefulness, and ease of understanding.

The learner types freely into a real conversation interface. A fresh, isolated
AI_thena session is provisioned for each run, and the model generates the
opening question from the configured course context. Quick starts are available
for a time-limited meeting, but they send ordinary learner messages rather than
reveal static response boxes. Requests for more help are also sent through the
real chat route so AI_thena's hint ladder can respond. The instructor view begins
with persisted observations, provisional interpretations, what is not
established, and next actions before revealing the underlying interaction
record.

This sequence provides evidence about the product, reasoning process, changes,
support dependence, learner agency, and one bounded transfer opportunity. One
successful reapplication is useful evidence; it is not proof of durable
transfer.

## Configuration boundary

The current content package lives in
`src/lib/demo/complex-systems-demo.ts`. It contains:

- the Systems & Society course and assignment scenario;
- the optional New York City subway sample case;
- plain-language definitions for novice visitors;
- the complete 0–5 #SystemAnalysis rubric;
- a baseline and improved learner attempt;
- a changed-question, reduced-support prompt; and
- a clearly labelled pre-recorded conversation and prototype evidence-band
  logic used only for that example.

`src/app/api/demo/start/route.ts` provisions a bounded, isolated live session.
The complete four-step assignment and the #EvidenceBased, #SystemAnalysis,
#EmergentProperties, #Professionalism, and #Audience criteria are readable
course sources, so the learner can ask what the assignment or any rubric
requires. A separate system-neutral protected target defines the work AI_thena
must not complete. `src/app/api/demo/opening/route.ts` generates an orienting
opening from the same AI_thena system prompt, and
`src/app/api/demo/evidence/route.ts` exposes only the capability-scoped evidence
for that learner run. To create a second assignment demo, add another typed
configuration module and replace the session prompt, protected target, course
sources, and checkpoints. Retain the learning sequence and the distinction
between observed evidence and provisional interpretation.

## MVP interpretation boundary

- The live instructor view shows AI_thena's native outcome status and evidence,
  not a fabricated 0–5 score. Each outcome remains visibly unassessed until the
  learner produces relevant evidence; all supplied 0–5 rubrics remain available
  for instructor judgment.
- The pre-recorded example may show a transparent prototype rubric match, but it
  is clearly labelled as illustrative rather than live AI_thena evidence.
- Band 5 requires the complete target reasoning plus consideration of an
  alternative decomposition; qualified instructor judgment is still required.
- A stronger response after support is not, by itself, evidence of independent
  capability. Reduced-support reapplication is treated separately.
- The live instructor evidence map comes from persisted checkpoints,
  diagnostics, consequential evidence signals, and the generated teaching
  brief. Every interpretation remains reviewable.
- Reviewer ratings and comments remain in the browser and can be copied as
  structured text; they are not submitted or stored.
- A live session is limited to ten exchanges and uses a capability token;
  the server-side model key is never exposed to the browser.
- The demo route does not initialize Clerk, and Next.js development indicators
  are hidden, so a local colleague preview is not obscured by setup overlays.

## Verification

The vertical slice is covered by `tests/assignment-demo.test.ts`. The full
repository test suite, type check, targeted lint, and production build should
pass before sharing the preview.
