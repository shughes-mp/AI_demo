import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

test("migrated evidence database preserves normalized links and provenance", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-demo-evidence-"));
  const dbPath = path.join(tempDir, "contract.db");

  try {
    const sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");
    for (const directory of fs.readdirSync(migrationsDir).sort()) {
      const migrationPath = path.join(migrationsDir, directory, "migration.sql");
      if (fs.existsSync(migrationPath)) {
        sqlite.exec(fs.readFileSync(migrationPath, "utf8"));
      }
    }
    sqlite.close();

    const adapter = new PrismaBetterSqlite3({
      url: `file:${dbPath.replace(/\\/g, "/")}`,
    });
    const client = new PrismaClient({ adapter } as never);

    try {
      const session = await client.session.create({
        data: {
          name: "Contract fixture",
          accessCode: `contract-${Date.now()}`,
          learningOutcomes: "Explain the claim",
          ownerClerkUserId: "owner-fixture",
        },
      });
      const reading = await client.reading.create({
        data: {
          sessionId: session.id,
          filename: "source.md",
          content: "The source distinguishes efficiency from effectiveness.",
        },
      });
      const accessGrant = await client.sessionInstructor.create({
        data: {
          sessionId: session.id,
          clerkUserId: "editor-fixture",
          role: "editor",
          grantedByUserId: "owner-fixture",
        },
      });
      assert.equal(accessGrant.role, "editor");
      const checkpoint = await client.checkpoint.create({
        data: {
          sessionId: session.id,
          orderIndex: 0,
          prompt: "How are the two concepts different?",
          processLevel: "infer",
        },
      });
      const outcome = await client.learningOutcome.create({
        data: {
          sessionId: session.id,
          orderIndex: 0,
          label: "Explain the claim",
          normalizedKey: "explain the claim",
        },
      });
      const question = await client.evidenceQuestion.create({
        data: {
          sessionId: session.id,
          checkpointId: checkpoint.id,
          orderIndex: 0,
          prompt: checkpoint.prompt,
          processLevel: checkpoint.processLevel,
        },
      });
      const learnerSession = await client.studentSession.create({
        data: {
          sessionId: session.id,
          studentName: "Fixture learner",
          accessTokenHash: "fixture-capability-hash",
        },
      });
      assert.equal(learnerSession.accessTokenHash, "fixture-capability-hash");
      const learnerMessage = await client.message.create({
        data: {
          studentSessionId: learnerSession.id,
          role: "user",
          content: "Efficiency and effectiveness mean the same thing.",
        },
      });
      const assistantMessage = await client.message.create({
        data: {
          studentSessionId: learnerSession.id,
          role: "assistant",
          content: "The source distinguishes the concepts.",
        },
      });
      const grounding = await client.tutorGrounding.create({
        data: {
          messageId: assistantMessage.id,
          studentSessionId: learnerSession.id,
          status: "grounded",
          sourceSetVersion: "sha256:fixture",
          retrievalVersion: "source-retrieval-1.0.0",
          promptVersion: "tutor-grounding-1.0.0",
          parserVersion: "tutor-grounding-parser-1.0.0",
          learnerCitationVisible: true,
          citations: {
            create: {
              readingId: reading.id,
              filename: reading.filename,
              passageId: "fixture-passage",
              quotedText: reading.content,
              startOffset: 0,
              endOffset: reading.content.length,
            },
          },
        },
        include: { citations: true },
      });
      assert.equal(grounding.citations[0].readingId, reading.id);
      const protectionAudit = await client.protectedAssessmentAudit.create({
        data: {
          sessionId: session.id,
          studentSessionId: learnerSession.id,
          messageId: assistantMessage.id,
          assessmentIds: "[]",
          triggerType: "answer_extraction",
          action: "coaching_without_disclosure",
          detail: "Protected fixture request.",
          policyVersion: "assessment-protection-1.0.0",
        },
      });
      assert.equal(protectionAudit.action, "coaching_without_disclosure");

      const signal = await client.evidenceSignal.create({
        data: {
          sessionId: session.id,
          studentSessionId: learnerSession.id,
          signalType: "possible_misunderstanding",
          scopeType: "learner",
          scopeId: learnerSession.id,
          claim: learnerMessage.content,
          confidenceLevel: "high",
          confidenceRationale: "The learner claim directly conflicts with the source.",
          limitations: "One exchange only.",
          missingEvidence: "No repair opportunity yet.",
          contradictoryEvidence: reading.content,
          learningOutcomeIds: JSON.stringify([outcome.id]),
          evidenceQuestionIds: JSON.stringify([question.id]),
          opportunitySummary: "One inference opportunity.",
          createdBy: "model",
          schemaVersion: "evidence-schema-1.0.0",
          productPolicyVersion: "product-1.0.0",
          terminologyVersion: "terminology-1.0.0",
          evidencePolicyVersion: "evidence-1.0.0",
          governancePolicyVersion: "governance-1.0.0",
          citations: {
            create: [
              {
                citationType: "learner_message",
                recordId: learnerMessage.id,
                messageId: learnerMessage.id,
                quotedText: learnerMessage.content,
                relevanceRationale: "Exact learner claim.",
              },
              {
                citationType: "source_passage",
                recordId: reading.id,
                readingId: reading.id,
                quotedText: reading.content,
                startOffset: 0,
                endOffset: reading.content.length,
                relevanceRationale: "Contradictory source passage.",
              },
            ],
          },
          learningOutcomeLinks: { create: { learningOutcomeId: outcome.id } },
          evidenceQuestionLinks: { create: { evidenceQuestionId: question.id } },
          qualifications: {
            create: [
              {
                kind: "contradictory_evidence",
                summary: reading.content,
                createdBy: "model",
              },
              {
                kind: "missing_evidence",
                summary: "No repair opportunity yet.",
                createdBy: "rule",
              },
            ],
          },
        },
      });

      const loaded = await client.evidenceSignal.findUniqueOrThrow({
        where: { id: signal.id },
        include: {
          citations: true,
          learningOutcomeLinks: { include: { learningOutcome: true } },
          evidenceQuestionLinks: { include: { evidenceQuestion: true } },
          qualifications: true,
        },
      });

      assert.equal(loaded.citations.length, 2);
      assert.equal(loaded.learningOutcomeLinks[0].learningOutcome.id, outcome.id);
      assert.equal(loaded.evidenceQuestionLinks[0].evidenceQuestion.id, question.id);
      assert.deepEqual(
        loaded.qualifications.map((item: any) => item.kind).sort(),
        ["contradictory_evidence", "missing_evidence"]
      );
      await assert.rejects(client.learningOutcome.delete({ where: { id: outcome.id } }));

      const replacement = await client.evidenceSignal.create({
        data: {
          sessionId: session.id,
          studentSessionId: learnerSession.id,
          signalType: loaded.signalType,
          scopeType: loaded.scopeType,
          scopeId: loaded.scopeId,
          claim: "The learner may be conflating efficiency with effectiveness.",
          confidenceLevel: "medium",
          confidenceRationale: "Reprocessed with a more qualified interpretation.",
          limitations: loaded.limitations,
          missingEvidence: loaded.missingEvidence,
          contradictoryEvidence: loaded.contradictoryEvidence,
          opportunitySummary: loaded.opportunitySummary,
          createdBy: "model",
          schemaVersion: loaded.schemaVersion,
          productPolicyVersion: loaded.productPolicyVersion,
          terminologyVersion: loaded.terminologyVersion,
          evidencePolicyVersion: loaded.evidencePolicyVersion,
          governancePolicyVersion: loaded.governancePolicyVersion,
          supersedesSignalId: loaded.id,
        },
      });
      const replacementWithPrior = await client.evidenceSignal.findUniqueOrThrow({
        where: { id: replacement.id },
        include: { supersedesSignal: true },
      });
      assert.equal(replacementWithPrior.supersedesSignal?.id, signal.id);
    } finally {
      await client.$disconnect();
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
