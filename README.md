# AI_thena

AI_thena helps instructors turn reading-based learner dialogue into usable formative evidence and practical teaching next steps.

It is built for courses where interpretation, reasoning, and application matter. Instructors upload course readings, define learning goals, preview what learners will experience, share a link, and then review source-linked evidence, learner activity, and teaching briefs after students work with the tutor.

The current application covers the roadmap through Phase 8.5: instructor setup, learner dialogue, evidence provenance and review, source-use checks, assessment protection, learner reflection, exportable teaching briefs, instructor-controlled teaching moves, pre-session planning with a faithful learner preview, and a calmer instructor workflow built around four required setup cards, one merged preview-and-share launch step, and collapsed optional planning and safeguard sections.

[Open the live prototype](https://aithena-learning.vercel.app/)

For a no-login, preconfigured illustration of assignment coaching and formative
evidence, open `/demo`. Each interactive run provisions an isolated AI_thena
session and uses the real model, source-grounding, assessment-protection,
adaptive-support, diagnostic, summary, and teaching-brief paths. The separate
pre-recorded example remains available for a predictable meeting walkthrough.
The live learner may begin with the instructions, foundational concepts and
skills, system selection, or their own work; no system is predetermined.
If no model key is configured, the demo reports that limitation explicitly
rather than substituting scripted coaching.

Learners work through assigned material in a guided Socratic dialogue that treats the course readings as its primary reference while allowing clearly identified broader context when useful. As learners respond, AI_thena creates traceable evidence about reasoning, possible misunderstandings, confidence, progress, and next teaching moves.

It is not just a chatbot or an automated grader. It is a learning conversation for students, an auditable evidence-review environment for instructors, and a formative signal for programs that care about how learners think.

## At a Glance

| Function | What AI_thena Does |
| --- | --- |
| Teaching | Helps instructors review learner progress, possible misunderstandings, readiness patterns, source evidence, teaching moves, and proportionate Observer/Guide/Conductor pivots. |
| Learning | Guides learners through source-first dialogue with Socratic questions, confidence checks, proportional help, and reflection. |
| Assessment | Produces qualified formative evidence against instructor-defined outcomes, with citations, confidence explanations, and instructor review controls. |

## Start Here: Instructor Workflow

AI_thena is organized around the natural teaching timeline:

1. **Task**: choose where the session sits in the learning cycle and define the learning outcomes you want to assess.
2. **Materials**: upload the reading or source material learners should use as their primary reference.
3. **Questions**: add the core evidence questions AI_thena should listen for.
4. **Preview & share**: preview the learner experience, then reveal and copy the learner link only when setup is ready.
5. **Watch learner activity**: see who joined, who may need attention, and what happened in the conversation.
6. **Review learner evidence**: inspect claims that may need instructor judgment, with source passages available behind "Show evidence."
7. **Prepare teaching brief**: use the evidence to decide what to do next before, during, or after class.

Required setup stays visible through the top progress cards. Teaching context, source-use safeguards, and protected assessment controls remain available as optional collapsed sections when instructors want more control without extra setup noise.

## How It Works

1. An instructor creates a session.
2. The instructor chooses the session purpose, defines learning outcomes, and uploads source readings.
3. The instructor can add key questions, teaching context, protected assessment materials, and a planned learner task and output.
4. Before sharing the link, the instructor can preview the learner journey, resolve design warnings, plan participation, and prepare bounded Guide or Conductor language for likely wobble points.
5. Learners open a shared link, enter their name, and begin a guided chat.
6. The tutor starts with prior knowledge, then asks one Socratic question at a time.
7. Support escalates through an eight-step productive-struggle ladder rather than immediately supplying an answer.
8. A separate diagnostic pass creates provisional, source-linked evidence signals after each exchange.
9. Learners finish with an explicitly limited AI summary that they can reflect on, annotate, or contest.
10. Instructors inspect citations and provenance, then approve, revise, reject, or supersede consequential evidence before using it.
11. Deterministic rules may suggest Observer, Guide, or Conductor; the instructor decides whether to accept, change, reject, or record the move.

AI_thena can support different moments in the learning cycle:

- `Pre-class`: check comprehension and readiness before class.
- `In-class Prep`: activate retrieval before an activity.
- `In-class Reflection`: consolidate learning through self-explanation.
- `After Class`: push toward transfer and application.

New sessions currently default to `Pre-class`. Instructors can change the session purpose in the session workspace.

## Who It Is For

- Instructors who want better evidence of learner understanding before, during, or after class.
- Adult, executive, and professional learning programs.
- Courses where reading, interpretation, reasoning, and application matter.
- Teams exploring AI-supported tutoring, teaching analytics, and formative assessment.

## What Learners Experience

Learners do not need an account. They open the session link, enter their name, and chat with a tutor grounded in the instructor's uploaded materials.

The tutor and learner experience:

- begins by asking what the learner already knows or believes;
- treats uploaded readings as the primary authority for claims about the course material;
- can add useful broader explanations, examples, and connections when they are clearly distinguished from the reading;
- asks one guiding question at a time;
- escalates help proportionately from current thinking and evidence prompts through hints, limited modeling and, when justified, direct clarification;
- uses deeper Socratic probing for interpretation, application, and conceptual confusion;
- checks confidence and revisits fragile topics;
- protects uploaded assessment materials by coaching without supplying protected answers;
- ends with a formative learner-facing summary that explicitly states its limitations;
- lets learners add a reflection, correct the summary, or mark it inaccurate or incomplete before instructor review.

A session is available to learners only after it has at least one uploaded source reading and at least one learning outcome.

## What Instructors Can Do

Instructors can:

- create sessions with shareable learner links and access codes;
- sign in securely and control owner, editor, or viewer access to each session;
- upload `.pdf`, `.docx`, `.txt`, and `.md` readings;
- optionally upload protected assessment materials;
- define learning outcomes and session goals;
- choose a session purpose;
- configure tutor stance, exchange limits, and availability dates;
- add key questions manually or generate suggestions from readings;
- preview the exact learner orientation, opening question, task, evidence questions, help behavior, grounding, protection, and reflection flow before launch;
- run deterministic session-design checks and plan thinking time, peer exchange, alternative response channels, quieter voices, and participation resets;
- generate or write likely stuck points with diagnosis, Guide, Conductor, escalation, release, and intended-output language;
- monitor learner activity and conversation traces;
- inspect exact source passages behind tutor claims and review protected-material interventions;
- review evidence that needs instructor judgment with approve, revise, reject, annotate, and supersede actions;
- filter and sort evidence by learning outcome, evidence question, evidence strength, confidence, review state, resolution state, and learner;
- inspect uncertainty, opportunity coverage, contradictory evidence, missing-evidence limits, timestamps, and review history;
- review common misunderstandings across the class;
- generate teaching recommendations;
- review versioned teaching briefs with purpose-specific evidence maps and export provenance-rich PDFs;
- inspect evidence-linked Observer, Guide, and Conductor pivots during live review and in teaching briefs;
- accept, change, reject, edit, record, and evaluate a facilitation move without automatic intervention.

## What AI_thena Produces

AI_thena turns learner conversations into instructor-facing evidence:

- learner progress summaries;
- confidence checks;
- qualified topic-understanding signals;
- checkpoint coverage;
- misconception clusters;
- prevalence and resolution rates;
- possible engagement concerns based on observable interaction patterns;
- question difficulty signals;
- 5-minute, 15-minute, and 30-minute teaching recommendations;
- formative learning outcome assessments;
- purpose-aware teaching briefs and evidence maps with learner counts, opportunity coverage, confidence, contradictory or missing evidence, and instructor review state;
- deterministic facilitation pivots with evidence scope, diagnosis, rationale, phrase, confidence, escalation, release, and instructor decision state;
- per-student notes and summaries.

These outputs are formative teaching aids. They are designed to help instructors make better decisions, not to replace instructor judgment.

Consequential signals retain learner-message and source-passage provenance. AI-generated interpretations remain marked as needing instructor review until an instructor approves, revises, or rejects them, and learner-authored reflection or disagreement is preserved alongside the AI summary.

## Instructor Surfaces

- `Session workspace`: guided hub with four required setup cards (`Task`, `Materials`, `Questions`, `Preview & share`), followed by optional teaching context, source-use safeguards, and assessment controls.
- `Preview learner experience`: learner-experience preview, design checks, participation plan, and likely stuck points prepared before launch.
- `Source use check`: passage-level tutor citations, unsupported-source events, broader-context use, and protected-material interventions.
- `Review learner evidence`: qualified signals with citations, confidence rationale, review state, and instructor actions.
- `Learner activity`: live or snapshot view of who joined, who may need support, and each learner's conversation trace.
- `Session analysis`: quick brief, full analysis, learner outcomes, misconception patterns, question difficulty, and teaching recommendations.
- `Common misunderstandings`: class-level misconception clusters and recommendation generation.
- `Teaching brief`: a versioned, evidence-linked synthesis with purpose-specific evidence maps, suggested teaching moves, facilitation pivots, per-learner notes, explicit review state, and PDF export.
- `Live review`: evidence-linked Observer, Guide, or Conductor suggestions that never intervene automatically and remain editable by the instructor.

## Local Development

### Requirements

- Node.js
- pnpm
- An Anthropic API key
- A Clerk application for instructor sign-in

### Environment Variables

Create a local `.env.local` file inside the app folder.

For local development, set `AI_THENA_USE_LOCAL_DATABASE=1` to guarantee that the app runtime uses `file:./prisma/dev.db`, even when Turso variables are also present. Prisma CLI commands use `LOCAL_DATABASE_URL`, then `DATABASE_URL`, then the fallback configured in `prisma.config.ts`.

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOCAL_DATABASE_URL=file:./prisma/dev.db
DATABASE_URL=file:./prisma/dev.db
# Set to 1 to force local SQLite when Turso variables are also present.
AI_THENA_USE_LOCAL_DATABASE=1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Clerk keyless mode can bootstrap local development, but deployed environments must use keys from their Clerk application. Instructor routes and session APIs require Clerk authentication. Learners do not need accounts; the app issues a private capability token when they join and stores only its hash.

Optional production variables:

```bash
TURSO_DATABASE_URL=libsql://your-production-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
# During the first authenticated deployment, assign any pre-existing sessions
# to a known Clerk user. Remove this after verifying the assignment.
LEGACY_SESSION_OWNER_CLERK_USER_ID=user_your_clerk_user_id
```

Optional model overrides:

```bash
ANTHROPIC_MODEL_PRIMARY=claude-sonnet-4-6
ANTHROPIC_MODEL_FAST=claude-haiku-4-5-20251001
```

Do not commit `.env.local`.

### Install and Run

This repository uses `pnpm`. From the app folder:

```bash
pnpm install
pnpm exec prisma migrate dev
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Verification

Useful checks:

```bash
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

Or run the complete local quality gate:

```bash
pnpm check
```

Current status:

- `pnpm build` succeeds.
- `pnpm exec tsc --noEmit` succeeds.
- `pnpm lint` succeeds.
- `pnpm test` currently passes 66 tests covering migrations, evidence provenance and review, Phase 5 filtering and authorization, authentication and learner capabilities, source grounding, protected assessment behavior, the productive-struggle ladder, purpose-aware tutoring, formative summaries, learner reflection, teaching-brief contracts and export safety, deterministic facilitation rules and instructor controls, Phase 8 preview and planning contracts, rate limiting, deletion, build-safe clients, route fallbacks, and database-schema parity.
- `pnpm audit` reports zero known dependency vulnerabilities.
- GitHub Actions runs install, audit, tests, lint, type checking, and build automatically.

## Database and Deployment

AI_thena uses two database modes:

- Local development: `better-sqlite3` with `prisma/dev.db`.
- Production: Turso Cloud through Prisma's libsql adapter.

Important details:

- Prisma CLI schema commands use `LOCAL_DATABASE_URL`, `DATABASE_URL`, or the fallback in `prisma.config.ts`.
- Local app runtime uses the Better SQLite adapter when `AI_THENA_USE_LOCAL_DATABASE=1` or no Turso/libsql URL is present.
- Production runtime uses `TURSO_DATABASE_URL` or a `DATABASE_URL` that starts with `libsql://`.
- Production without a Turso/libsql URL throws a configuration error.
- The app includes runtime Turso bootstrap SQL for production tables, indexes, and incremental schema upgrades.

The production build command is:

```bash
prisma generate && next build
```

For Vercel, configure:

- `ANTHROPIC_API_KEY`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

For a deployment containing sessions created before Clerk authentication was added, also set `LEGACY_SESSION_OWNER_CLERK_USER_ID` to the Clerk user who should initially own those sessions. Verify the assignments before removing it. New sessions automatically belong to their authenticated creator, and owners can delegate editor or viewer access.

Do not rely on `prisma db push` during the Vercel build for Turso schema creation. Use `npx prisma migrate dev` for local schema work and handle Turso schema rollout as a separate operational step.

## Quick Test Flow

1. Create an instructor session.
2. Choose the session purpose and add at least one learning outcome.
3. Upload a reading.
4. Add at least one evidence question manually or generate suggestions from the reading.
5. Open **Preview learner experience**, save the preview, and return to the merged **Preview & share** step.
6. Copy the learner link from Step 4 and open it in another browser window.
7. Enter a learner name and begin the chat.
8. Have a short tutoring conversation.
9. End the learner session and review the learner summary.
10. Add a learner reflection or mark part of the AI summary inaccurate or incomplete.
11. Return to the instructor workspace and inspect learner activity, source use, learner evidence, or session analysis.
12. Review evidence before generating reports, recommendations, misconception patterns, or PDF exports.

## Implementation Status

The implementation roadmap is deployed and operationally verified through Phase 8, with Phase 8.5 complete as a UX coherence pass:

- **Phase 0:** architecture, terminology, risk, and test baseline.
- **Phase 1:** product, evidence, facilitation, governance, and versioning contracts.
- **Phase 2:** evidence provenance, instructor review actions, authorization, and learner capabilities.
- **Phase 3:** source-first grounding, passage citations, broader-context transparency, and protected-assessment enforcement.
- **Phase 4:** learner orientation, proportional help, purpose-aware dialogue, formative summaries, and learner reflection or correction.
- **Phase 4.5:** dependency and repository security, CI gates, resilient route states, request throttling, owner deletion, and hardening tests.
- **Phase 5:** complete evidence inspection, filtering and sorting, uncertainty and opportunity displays, source-linked misconception review, timestamped review history, and role-safe report generation.
- **Phase 6:** versioned teaching briefs, evidence-linked purpose maps, explicit formative-use boundaries, review-state visibility, and provenance-rich PDF exports.
- **Phase 7:** deterministic Observer/Guide/Conductor recommendations, evidence and release conditions, live and report integration, and instructor-controlled decisions and outcome recording.
- **Phase 8:** faithful learner preview, deterministic session-design warnings, participation planning, and editable Guide-first anticipated pivots delivered into the real learner flow.
- **Phase 8.5:** instructor workflow, progressive disclosure, clearer labels, calmer empty states, four-card required setup architecture, merged preview/share launch step, required/recommended/optional setup separation, preview-before-share gating, recall-only question cautions, hidden optional trust checks, and accessibility-oriented UI cleanup.

See the [implementation roadmap](AI_thena_implementation_roadmap.md) and [phase documentation](docs/README.md) for acceptance gates, limitations, and verification details.

Production smoke testing has confirmed instructor authentication, real-session evidence review, stale-brief protection, owner/editor brief refresh, provenance-rich PDF export, the complete Phase 7 facilitation workflow, and Phase 8 planning preview. Authenticated sessions exercised Observer, Guide, and Conductor recommendations; instructor acceptance, override, rejection rationale, edited phrasing, move recording, and helpfulness; viewer read-only enforcement; desktop/mobile keyboard use; color-independent labels; refreshed teaching-brief/PDF output; learner preview; generated likely stuck points; learner-facing planned opening language; learner activity; source-use checks; and teaching brief integration. The previously exposed Anthropic credential was revoked and replaced.

## Caveats

- This is an MVP and should be treated as an early production prototype.
- PDF extraction works best with text-based PDFs, not scanned-image PDFs.
- Scanned or image-based PDFs should be converted or replaced with DOCX, TXT, or Markdown.
- The file parser enforces a 10MB upload limit.
- Tutoring quality depends heavily on the quality of uploaded source material and learning outcomes. Broader model knowledge may also be incomplete or outdated and is identified separately from the assigned reading.
- Assessment protection reduces answer leakage but should not be treated as a formal exam-security guarantee.
- AI-generated diagnostics, learning outcome assessments, summaries, and teaching recommendations are formative aids that instructors should review.
- Misconception detection runs after the tutor response, so dashboard updates may lag slightly behind the learner-visible chat.
- Request throttling in the application is per running instance. Broad public deployment should also enable Vercel Firewall rate limits.
- Owners can delete a session and its associated learner data from the session workspace. Automated retention schedules and institutional data-export policy remain future governance work.
- Recommendation generation falls back to deterministic cards when structured AI output cannot be parsed.
- Changing the session purpose affects future tutor behavior and future report framing, but it does not retroactively change recorded conversations.
- Live engagement flags are lightweight heuristics, not definitive judgments about learner effort.

## Tech Stack

- Next.js 16
- React 19
- Prisma 7
- SQLite for local development
- Turso/libsql for production
- Anthropic SDK and AI SDK
- Tailwind CSS 4
- Puppeteer Core with serverless Chromium for PDF export

## Repository Safety

- Keep `.env.local` out of Git.
- Never commit real API keys or Turso tokens.
- Do not commit local database files.
- Use placeholder credentials in examples only.
