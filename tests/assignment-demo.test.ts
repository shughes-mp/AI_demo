import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  SYSTEMS_SOCIETY_DEMO,
  analyzeReasoning,
  buildCoachResponse,
  formatReviewerFeedback,
  getEvidenceBand,
} from "../src/lib/demo/complex-systems-demo.ts";

test("the focused demo uses the supplied zero-to-five #SystemAnalysis rubric", () => {
  assert.deepEqual(SYSTEMS_SOCIETY_DEMO.assignment.rubricScale, {
    minimum: 0,
    maximum: 5,
  });
  assert.equal(SYSTEMS_SOCIETY_DEMO.outcome.label, "#SystemAnalysis");
  assert.equal(SYSTEMS_SOCIETY_DEMO.outcome.rubric.length, 6);
});

test("the demo orients a first-time visitor without predetermining their system", () => {
  assert.equal(SYSTEMS_SOCIETY_DEMO.course, "Systems & Society");
  assert.equal(SYSTEMS_SOCIETY_DEMO.sampleSystem, "New York City subway");
  assert.match(SYSTEMS_SOCIETY_DEMO.assignment.currentTask, /choose and justify/i);
  assert.equal(SYSTEMS_SOCIETY_DEMO.steps.length, 4);
  assert.equal(SYSTEMS_SOCIETY_DEMO.outcomes.length, 4);
  assert.equal(SYSTEMS_SOCIETY_DEMO.additionalSkill.label, "#Audience");
  assert.ok(SYSTEMS_SOCIETY_DEMO.submissionRequirements.length >= 7);
});

test("the initial attempt is recognised as a list of levels with limited justification", () => {
  const profile = analyzeReasoning(SYSTEMS_SOCIETY_DEMO.initialAttempt);
  assert.equal(profile.agents, true);
  assert.equal(profile.micro, true);
  assert.equal(profile.meso, true);
  assert.equal(profile.macro, true);
  assert.equal(profile.attributes, false);
  assert.equal(profile.usefulness, false);
  assert.equal(getEvidenceBand(profile), 2);
});

test("a direct completion request preserves the assignment boundary", () => {
  const response = buildCoachResponse(
    "Write the system analysis section of the assignment for me.",
    4
  );
  assert.equal(response.mode, "protect");
  assert.match(response.message, /can’t write the assignment section/i);
  assert.match(response.prompt, /what question/i);
});

test("the worked example includes authentic confusion and an attempted answer request", () => {
  const learnerTurns = SYSTEMS_SOCIETY_DEMO.workedConversation
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");
  const profile = analyzeReasoning(learnerTurns);

  assert.match(learnerTurns, /I’m confused/i);
  assert.match(learnerTurns, /write the system analysis section for me/i);
  assert.equal(profile.answerRequest, true);
  assert.equal(profile.usefulness, false);
  assert.equal(getEvidenceBand(profile), 3);
});

test("a strong multilevel analysis earns a bounded band four", () => {
  const profile = analyzeReasoning(SYSTEMS_SOCIETY_DEMO.improvedAttempt);
  assert.equal(profile.explanatoryChallenge, true);
  assert.equal(profile.attributes, true);
  assert.equal(profile.crossLevelInteractions, true);
  assert.equal(profile.usefulness, true);
  assert.equal(getEvidenceBand(profile), 4);
});

test("band five requires evidence of considering an alternative decomposition", () => {
  const profile = analyzeReasoning(
    `${SYSTEMS_SOCIETY_DEMO.improvedAttempt} An alternative decomposition by passenger journey instead of organisational level could reveal where transfers create the greatest burden.`
  );
  assert.equal(profile.alternativeDecomposition, true);
  assert.equal(getEvidenceBand(profile), 5);
});

test("reviewer feedback preserves zero and missing ratings", () => {
  const text = formatReviewerFeedback({
    ratings: {
      "learner-ownership": 0,
      "learning-value": 5,
      "evidence-credibility": null,
      "recommendation-usefulness": 3,
      "ease-of-understanding": 4,
    },
    credible: "The learner role was clear.",
    challenge: "Validate the inference rules.",
    change: "Test with representative learners.",
  });
  assert.match(text, /Learner ownership: 0\/5/);
  assert.match(text, /Evidence credibility: Not rated/);
});

test("the interactive demo uses real AI_thena services without a disguised fallback", () => {
  const component = readFileSync(
    new URL("../src/app/demo/assignment-demo.tsx", import.meta.url),
    "utf8"
  );
  const startRoute = readFileSync(
    new URL("../src/app/api/demo/start/route.ts", import.meta.url),
    "utf8"
  );
  const endRoute = readFileSync(
    new URL("../src/app/api/end-session/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(component, /fetch\("\/api\/demo\/opening"/);
  assert.match(component, /fetch\("\/api\/chat"/);
  assert.match(component, /fetch\("\/api\/end-session"/);
  assert.match(component, /fetch\("\/api\/demo\/evidence"/);
  assert.match(component, /generateReport: false/);
  assert.match(component, /generateReport: true/);
  assert.doesNotMatch(component, /Guided fallback/i);
  assert.doesNotMatch(component, /buildCoachResponse/);
  assert.match(startRoute, /mode: "unavailable"/);
  assert.doesNotMatch(startRoute, /mode: "guided"/);
  assert.match(endRoute, /learnerTurnCount < 3/);
  assert.match(endRoute, /validateLearnerSummary/);
});

test("each live demo run is isolated and separates readable instructions from protected work", () => {
  const startRoute = readFileSync(
    new URL("../src/app/api/demo/start/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(startRoute, /prisma\.session\.create/);
  assert.doesNotMatch(startRoute, /prisma\.session\.upsert/);
  assert.match(startRoute, /Assignment-1-instructions\.txt/);
  assert.match(startRoute, /Assignment-1-learning-outcomes-and-rubrics\.txt/);
  assert.match(startRoute, /Assignment-1-protected-target\.txt/);
  assert.doesNotMatch(startRoute, /has selected the New York City subway/);
  assert.match(startRoute, /has not necessarily selected a system/);
  assert.match(startRoute, /stance: "mentor"/);
  assert.match(startRoute, /sessionPurpose: "after_class"/);
});

test("the live learner start routes foundational needs and keeps demo-only probes elsewhere", () => {
  const component = readFileSync(
    new URL("../src/app/demo/assignment-demo.tsx", import.meta.url),
    "utf8"
  );
  const openingRoute = readFileSync(
    new URL("../src/app/api/demo/opening/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(component, /Help me understand the assignment/);
  assert.match(component, /Explain the key concepts and skills/);
  assert.match(component, /Help me choose or check a system/);
  assert.match(component, /I have an idea or draft to discuss/);
  assert.match(component, /Open the full assignment/);
  assert.match(component, /Not selected yet/);
  assert.doesNotMatch(component, /Share the example learner’s first attempt/);
  assert.match(component, /Optional stress tests/);
  assert.match(openingRoute, /const DEMO_OPENING/);
  assert.match(openingRoute, /Where would you like to begin\?/);
  assert.doesNotMatch(openingRoute, /messages\.create/);
});

test("the demo uses the original waiting animation and context-neutral learner language", () => {
  const component = readFileSync(
    new URL("../src/app/demo/assignment-demo.tsx", import.meta.url),
    "utf8"
  );
  const startRoute = readFileSync(
    new URL("../src/app/api/demo/start/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(component, /import \{ TypingIndicator \}/);
  assert.match(component, /<TypingIndicator \/>/);
  assert.doesNotMatch(component, /considering your reasoning/i);
  assert.match(
    component,
    /setMessages\(\[\s*\{ id: messageId\(\), role: "assistant", content: openingData\.opening \},\s*\]\);\s*setConnectionMode\("live"\)/
  );
  assert.match(component, /Ask a question, share an idea, or paste something you want to discuss/);
  assert.match(component, /I’m new to this\. What exactly do I need to do\?/);
  assert.match(startRoute, /LEARNER-FACING VOICE AND EXPERIENCE/);
  assert.match(startRoute, /Do not describe every contribution as "reasoning/);
  assert.match(startRoute, /thoughtful practitioner with a point of view/);
});

test("the demo opens without a model call and reports unavailable model credits accurately", () => {
  const component = readFileSync(
    new URL("../src/app/demo/assignment-demo.tsx", import.meta.url),
    "utf8"
  );
  const chatRoute = readFileSync(
    new URL("../src/app/api/chat/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(component, /failure\.error/);
  assert.match(chatRoute, /MODEL_CREDITS/);
  assert.match(chatRoute, /credit balance is too low/);
  assert.match(chatRoute, /restore its Anthropic API access/);
});

test("the no-login demo bypasses Clerk while instructor pages remain protected", () => {
  const proxy = readFileSync(
    new URL("../src/proxy.ts", import.meta.url),
    "utf8"
  );

  assert.match(proxy, /if \(!isInstructorPage\(request\)\)/);
  assert.match(proxy, /return NextResponse\.next\(\)/);
  assert.match(proxy, /protectInstructorPages\(request, event\)/);
});
