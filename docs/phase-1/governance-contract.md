# AI_demo Governance Contract

Contract version: `governance-1.0.0`

## Purpose

This contract establishes the minimum conditions for responsible handling of learner data, protected materials, AI inferences, access, retention, and institutional use.

It is a product and engineering baseline, not jurisdiction-specific legal advice. Deploying institutions must review it against applicable law and policy.

## Identity And Ownership

### Instructor

- Every production instructor must authenticate.
- Every session must have an owner or explicitly authorized instructor group.
- Instructor APIs must verify ownership or delegated access.
- Possession of a session ID is not authorization.

### Learner

- Account-free learner access may remain supported.
- An access code authorizes entry to a specific open session, not access to instructor records.
- A learner session must use a scoped, unguessable capability or authenticated identity.
- Possession of a raw `studentSessionId` is not sufficient authorization.
- Display names should be treated as potentially identifiable personal data.

### Institutional Administrator

- Institutional policy administrators may configure retention, providers, features, and access.
- Administrative access must be logged and least-privileged.

## Data Classification

| Class | Examples | Default sensitivity |
|---|---|---|
| Public product data | Landing-page copy | Public |
| Instructor configuration | Course context, outcomes, questions | Internal educational data |
| Source materials | Uploaded readings | Potentially copyrighted/confidential |
| Protected assessment materials | Prompts, answer keys | Restricted |
| Learner identity data | Name, account identifier | Personal data |
| Learner dialogue | Messages and summaries | Sensitive educational data |
| AI inferences | Misunderstanding, outcome, confidence, interaction signals | Sensitive educational data |
| Diagnostic/model logs | Raw model responses, errors | Restricted sensitive data |
| Reviewed evidence | Instructor-approved/revised signals | Educational record where policy applies |

## Data Minimization

AI_demo must:

- Collect only data needed for the stated learning purpose.
- Avoid storing raw model reasoning not required for review or debugging.
- Avoid duplicating protected material in logs.
- Avoid retaining raw diagnostic responses by default when structured results suffice.
- Keep learner identity separate from content where feasible.
- Allow instructors to run pseudonymous sessions when appropriate.

## Learner Notice

Before participation, learners must be told:

- AI_demo is AI-assisted.
- The instructor may review the conversation.
- The purpose is formative learning evidence.
- What data is collected.
- What provisional inferences may be generated.
- How long data is retained or where policy can be found.
- Whether participation is required and what alternative exists, where applicable.
- How to request access, correction, or deletion where policy permits.
- That AI output may be incomplete or wrong.

Notice must be concise at entry with access to fuller policy.

## Retention Baseline

Institutions must configure retention explicitly. Until configured, production deployment must not silently retain data indefinitely.

Recommended conservative defaults:

- Raw diagnostic/model responses: 30 days maximum
- Raw learner dialogue: 90 days after session close
- Protected assessment materials: remove at session deletion or 90 days after close, whichever comes first, unless instructor renews under policy
- Provisional unreviewed inferences: same period as raw dialogue
- Reviewed formative evidence: up to 365 days when institutionally justified
- Security audit logs: according to institutional security policy, with sensitive content excluded

These defaults must be configurable downward and reviewed before production use.

## Learner Rights And Contestability

Where applicable, learners should be able to:

- Access their dialogue and summary
- Identify that content is AI-generated
- Correct their display name
- Add context to or contest a learner summary
- Request correction or deletion under policy
- Know when reviewed evidence may inform an educational decision

An AI-generated inference must never be treated as incontestable.

## Instructor Review And High-Stakes Use

- Provisional AI signals must be visually distinct from instructor-reviewed signals.
- Unreviewed signals must not automatically trigger grades, sanctions, progression decisions, or formal accommodations.
- Instructor review must include access to underlying evidence.
- A review action must be logged.
- Institutional policy must govern any use in formal assessment.

## Protected Assessment Materials

Requirements:

- Store separately from learner-visible sources.
- Restrict access to authorized instructors and constrained AI processing.
- Do not include protected answers in learner-visible logs, summaries, or exports.
- Minimize protected text sent to providers.
- Add adversarial leakage tests.
- State clearly that AI_demo reduces risk but is not formal exam-security infrastructure.
- Provide deletion and expiry controls.

## Model And Provider Data Use

- Learner or instructor content must not be used to train provider models unless the institution and affected users have explicitly authorized it under applicable policy.
- Provider retention and data-use terms must be reviewed.
- Model/provider changes require governance and version review.
- Sensitive content should not be sent to an unapproved provider.

## Authorization Requirements

All production APIs must enforce:

- Authentication where required
- Session ownership or delegated role
- Learner capability scope
- Cross-session isolation
- Least privilege
- Audit logging for sensitive reads and writes

The following require explicit authorization tests:

- Session configuration
- File upload/delete
- Learner roster and dialogue
- Misunderstanding and outcome evidence
- Instructor reviews and overrides
- Reports and exports
- Protected assessment materials
- Deletion and retention operations

## Security Requirements

- Rate-limit public and AI-generating endpoints.
- Use unguessable, rotatable access codes.
- Prevent cross-session identifier access.
- Validate and constrain uploaded files.
- Treat uploaded content as untrusted prompt input.
- Do not expose provider errors or secrets to clients.
- Redact sensitive content from operational logs.
- Maintain dependency and vulnerability review.

## Prohibited Uses

AI_demo must not support:

- Hidden monitoring of learners
- Automated disciplinary decisions
- Automated detection of motivation, character, disability, or mental state
- Unreviewed automated grading
- General learner ranking
- Use of protected materials outside the configured learning purpose
- Model training on learner data without authority
- Indefinite retention by default

## Institutional Readiness Gate

Before institutional production use, confirm:

- Identity and authorization architecture
- Data-processing and provider review
- Retention configuration
- Learner notice and alternative pathway
- Protected-material policy
- Incident response
- Access, correction, and deletion process
- Feature-level risk approval
- Pilot and evaluation approval

