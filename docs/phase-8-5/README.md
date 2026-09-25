# Phase 8.5: Instructor UX Coherence And Progressive Disclosure

Phase 8.5 is a product-coherence pass. It does not add new AI capability. It makes the existing setup, preview, evidence, source-use, learner activity, and teaching-brief surfaces easier for a first-time instructor to understand while preserving the advanced audit trail for instructors who want it.

## What changed

- Instructor workflow is framed around before learners begin, during learner work, and after learner work.
- The session workspace now acts as a guided hub with a primary next step and a six-step instructor timeline.
- Required setup, recommended preparation, optional source-use checks, and advanced data controls are separated.
- The learner link is gated behind source material, learning purpose, evidence question, and saved learner preview checks.
- The preview page records the learner preview as checked when the instructor saves it and returns them to the learner link.
- Recall-only evidence questions receive a plain-language caution, without blocking instructor judgment.
- Technical labels are replaced with teacher-facing language.
- Evidence and technical details are increasingly shown through progressive disclosure.
- Source-use safeguards and session deletion are hidden behind explicit expansion controls.
- Empty states explain what will happen next instead of only saying nothing exists.
- Page copy emphasizes instructor control and formative use.

## Preferred instructor-facing labels

| Internal/older language | Instructor-facing language |
| --- | --- |
| Plan & preview | Preview learner experience |
| Learner progress | Learner activity |
| Evidence review | Review learner evidence |
| Grounding audit / Grounding & protection | Source use check |
| Facilitation intelligence | Suggested teaching moves |
| Anticipated pivot points | If learners get stuck |
| Provisional | Needs instructor review |

## UX smoke-test checklist

- Can a first-time instructor tell what is required and what is optional?
- Can they create a usable session in under five minutes?
- Can they preview the learner experience before sharing?
- Can they tell what to do next after setup, learner activity, evidence review, and brief generation?
- Can they understand the main teaching signal without internal AI_demo terminology?
- Can they inspect source evidence and technical details if desired?
- Can they safely ignore advanced details?
- Can they export a useful teaching brief?

## Verification

Current local verification:

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

All pass after the Phase 8.5 completion pass.

## Non-goals

- Do not remove evidence detail.
- Do not remove source-use records.
- Do not remove protected assessment behavior.
- Do not remove instructor control, override, or move-recording workflows.
- Do not simplify the app by making it less rigorous.
