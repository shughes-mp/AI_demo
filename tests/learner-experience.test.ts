import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildLearnerResponseSupportInstruction,
  buildLearnerSummaryPrompt,
  countHelpRequests,
  determineNextHintLadderRung,
  hasLearnerReflection,
  isHelpRequest,
  normalizeLearnerReflection,
  PRODUCTIVE_STRUGGLE_STEPS,
} from "../src/lib/learner-experience.ts";
import {
  buildContextInstruction,
  buildHintLadderInstruction,
  buildSystemPrompt,
} from "../src/lib/system-prompt.ts";

test("productive struggle exposes all eight proportional help steps", () => {
  assert.equal(PRODUCTIVE_STRUGGLE_STEPS.length, 8);
  for (let rung = 0; rung < 8; rung += 1) {
    assert.match(buildHintLadderInstruction(rung, "systems thinking"), new RegExp(`step ${rung + 1}/8`, "i"));
  }
  assert.match(buildHintLadderInstruction(6, "systems thinking"), /direct clarification/i);
  assert.match(buildHintLadderInstruction(7, "systems thinking"), /restate|apply/i);
});

test("repeated help requests are detected without treating every short answer as disengagement", () => {
  const messages = [
    { role: "user", content: "I don't know." },
    { role: "assistant", content: "What is your current thinking?" },
    { role: "user", content: "Just tell me the answer." },
  ];
  assert.equal(isHelpRequest("I am stuck. Help me."), true);
  assert.equal(countHelpRequests(messages), 2);
  assert.match(
    buildLearnerResponseSupportInstruction("I don't know.", 2),
    /asking for help again/i
  );
  assert.match(
    buildLearnerResponseSupportInstruction("Maybe efficiency?", 0),
    /very short/i
  );
  assert.doesNotMatch(
    buildLearnerResponseSupportInstruction("Maybe efficiency?", 0),
    /motivation is low|disengaged/i
  );
});

test("assignment orientation and foundational definitions are answered before productive struggle", () => {
  const orientation = buildLearnerResponseSupportInstruction(
    "Help me understand the assignment instructions and the skills I need.",
    1
  );
  assert.match(orientation, /factual orientation/i);
  assert.match(orientation, /answer directly/i);
  assert.match(orientation, /do not require a prior assignment attempt/i);
  assert.doesNotMatch(orientation, /follow the current productive-struggle rung/i);

  const definition = buildLearnerResponseSupportInstruction(
    "Can you explain what an emergent property is?",
    0
  );
  assert.match(definition, /foundational clarification/i);
  assert.match(definition, /plain-language explanation/i);
  assert.match(definition, /non-example|nearby concept/i);
});

test("long superficial responses are narrowed to one claim and its support", () => {
  const response = Array.from({ length: 125 }, () => "idea").join(" ");
  assert.match(
    buildLearnerResponseSupportInstruction(response, 0),
    /long but gives little explicit reasoning/i
  );
});

test("help ladder advances proportionately and requires restatement after clarification", () => {
  assert.equal(
    determineNextHintLadderRung(3, {
      directAnswer: null,
      feedbackType: "corrective",
      isGenuineAttempt: true,
    }),
    4
  );
  assert.equal(
    determineNextHintLadderRung(6, {
      directAnswer: "clarification",
      feedbackType: null,
      isGenuineAttempt: null,
    }),
    7
  );
});

test("learner summaries are formative, evidence-limited, and explicitly contestable", () => {
  const prompt = buildLearnerSummaryPrompt({
    transcript: "Student: I changed my view.\nTutor: What evidence changed it?",
    unresolvedMisconceptions: [
      { topicThread: "causality", description: "Confuses correlation and cause" },
    ],
  });
  assert.match(prompt, /not a grade, score, mastery judgment, or prediction/i);
  assert.match(prompt, /use only evidence visible in the transcript/i);
  assert.match(prompt, /may be incomplete or inaccurate/i);
  assert.match(prompt, /add a reflection or correction/i);
  assert.match(prompt, /Confuses correlation and cause/);
});

test("learner reflection normalization preserves corrections and limits stored text", () => {
  const reflection = normalizeLearnerReflection({
    changedThinking: "  I revised my initial claim.  ",
    summaryAnnotation: "x".repeat(2500),
    summaryContested: true,
  });
  assert.equal(reflection.changedThinking, "I revised my initial claim.");
  assert.equal(reflection.summaryAnnotation.length, 2000);
  assert.equal(reflection.summaryContested, true);
  assert.equal(hasLearnerReflection(reflection), true);
});

test("Phase 4 migration is additive and preserves existing learner sessions", () => {
  const migration = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "prisma/migrations/20260619_strengthen_learner_experience/migration.sql"
    ),
    "utf8"
  );
  assert.match(migration, /ALTER TABLE "StudentSession" ADD COLUMN "summaryAnnotation"/);
  assert.match(migration, /ADD COLUMN "reflectionChangedThinking"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/);
});

test("confidence calibration keeps uncertainty on-topic and tests high confidence", () => {
  const base = {
    lastTopicThread: "causality",
    currentAttemptCount: 1,
    exchangeCount: 4,
    maxExchanges: 12,
  };
  assert.match(
    buildContextInstruction({ ...base, confidenceRating: "uncertain" }),
    /do not advance topics/i
  );
  assert.match(
    buildContextInstruction({ ...base, confidenceRating: "very_confident" }),
    /transfer probe/i
  );
});

test("learning behavior changes with the session purpose", () => {
  const preClass = buildSystemPrompt([], false, { sessionPurpose: "pre_class" });
  const afterClass = buildSystemPrompt([], false, { sessionPurpose: "after_class" });
  assert.match(preClass, /comprehension readiness/i);
  assert.match(preClass, /explain[\s\S]*distinguish/i);
  assert.match(afterClass, /far transfer/i);
  assert.match(afterClass, /novel (?:professional|unfamiliar|context)/i);
});

test("reflection API requires learner capability and a completed session", () => {
  const route = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "src/app/api/student-sessions/[studentSessionId]/reflection/route.ts"
    ),
    "utf8"
  );
  assert.match(route, /matchesLearnerCapability/);
  assert.match(route, /studentSession\.endedAt/);
  assert.match(route, /studentSession\.sessionSummary/);
});
