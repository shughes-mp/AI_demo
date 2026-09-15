export const PRODUCTIVE_STRUGGLE_STEPS = [
  "Ask the learner to share their current thinking before supplying content.",
  "Ask which passage, example, or reason supports that thinking.",
  "Narrow the task to one specific concept or decision.",
  "Add one useful constraint or comparison without revealing the conclusion.",
  "Offer one concise hint tied to the learner's current reasoning.",
  "Model one limited reasoning move, then return the work to the learner.",
  "Give a direct clarification only when further struggle is no longer productive.",
  "Ask the learner to restate or apply the corrected idea in their own words.",
] as const;

export function determineNextHintLadderRung(
  currentRung: number,
  tags: {
    directAnswer: string | null;
    feedbackType: "corrective" | "extension" | "redirection" | null;
    isGenuineAttempt: boolean | null;
  }
): number {
  if (tags.directAnswer) return 7;
  if (
    tags.isGenuineAttempt &&
    tags.feedbackType &&
    tags.feedbackType !== "extension"
  ) {
    return Math.min(currentRung + 1, 6);
  }
  return currentRung;
}

const HELP_REQUEST_PATTERN =
  /\b(?:just\s+)?(?:tell|give|show)\s+me\s+(?:the\s+)?answer\b|\b(?:i\s+)?(?:do not|don't|dont)\s+know\b|\bi(?:'m| am)\s+stuck\b|\bhelp\s+me\b|\bwhat(?:'s| is)\s+the\s+answer\b/i;

const ORIENTATION_REQUEST_PATTERN =
  /\b(?:understand|explain|clarify|summari[sz]e|remind)\b.{0,60}\b(?:assignment|instructions?|requirements?|rubric|learning outcomes?|skills?)\b|\bwhat\b.{0,40}\b(?:need to (?:do|produce|submit)|skills? (?:are|am) (?:expected|required))\b/i;

const FOUNDATIONAL_CLARIFICATION_PATTERN =
  /\b(?:what (?:is|are|does)|define|explain|meaning of|not (?:sure|clear))\b.{0,70}\b(?:complex social system|complex|complicated|system ?analysis|emergent propert(?:y|ies)|agent|attribute|micro|meso|macro)\b/i;

export function isHelpRequest(value: string): boolean {
  return HELP_REQUEST_PATTERN.test(value);
}

export function countHelpRequests(messages: Array<{ role: string; content: string }>): number {
  return messages.filter(
    (message) => message.role === "user" && isHelpRequest(message.content)
  ).length;
}

export function buildLearnerResponseSupportInstruction(
  learnerMessage: string,
  helpRequestCount: number
): string {
  const words = learnerMessage.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  const orientationRequest = ORIENTATION_REQUEST_PATTERN.test(learnerMessage);
  const foundationalClarification = FOUNDATIONAL_CLARIFICATION_PATTERN.test(learnerMessage);

  if (orientationRequest) {
    lines.push(
      "The learner is asking for factual orientation, not asking you to perform the assessment. Answer directly from the supplied assignment source: concisely map the deliverable, stages, assessed learning outcomes, and critical constraints they asked about. Then ask one short question that checks or personalizes their understanding. Do not require a prior assignment attempt before giving this orientation."
    );
  } else if (foundationalClarification) {
    lines.push(
      "The learner is asking for a foundational clarification. Give a concise plain-language explanation, distinguish it from a likely non-example or nearby concept, then ask the learner to apply the distinction to a candidate of their own. Do not withhold the definition pending a prior attempt."
    );
  } else if (isHelpRequest(learnerMessage)) {
    lines.push(
      `The learner is asking for help${helpRequestCount > 1 ? " again" : ""}. Follow the current productive-struggle rung exactly; do not restart the ladder or jump straight to an answer.`
    );
  }

  if (words.length <= 4) {
    lines.push(
      "The learner response is very short. Do not infer low motivation. Ask the smallest concrete question that lets them show one piece of thinking."
    );
  } else if (words.length >= 120 && !/\b(because|therefore|evidence|passage|suggests|implies|however|although)\b/i.test(learnerMessage)) {
    lines.push(
      "The learner response is long but gives little explicit reasoning. Acknowledge no more than one relevant point, then ask for one claim and the evidence or reasoning that supports it."
    );
  }

  return lines.length > 0
    ? `[TUTOR_CONTEXT: ${lines.join(" ")}]`
    : "";
}

export function buildLearnerSummaryPrompt(input: {
  transcript: string;
  unresolvedMisconceptions: Array<{ topicThread: string; description: string }>;
}): string {
  return `The learner has completed a guided AI_thena learning session. Create a concise formative summary from the transcript below.

The summary is descriptive learning support, not a grade, score, mastery judgment, or prediction. Use only evidence visible in the transcript. If evidence is limited or mixed, say so plainly. Write in second person and use exactly these markdown sections:

## Topics covered
List 2-4 concepts or questions explored.

## Where your reasoning became clearer
List 1-3 specific places where the learner explained, connected, corrected, or applied an idea. Do not use generic praise and do not claim understanding without transcript evidence.

## What may be worth revisiting
List specific uncertainties, incomplete explanations, or unresolved misunderstandings. Phrase these as useful next steps, not deficits.

## A question to carry forward
Give one open question for the next learning moment.

## About this summary
Include exactly this sentence: "This AI-generated summary may be incomplete or inaccurate; you can add a reflection or correction before your instructor reviews it."

Do not add a preamble or closing outside these sections. Keep each content section to 1-4 bullets.

Unresolved misunderstandings:
${input.unresolvedMisconceptions.map((item) => `- ${item.topicThread}: ${item.description}`).join("\n") || "None recorded"}

Transcript:
${input.transcript}`;
}

type SummaryMessage = { role: string; content: string };

const SUMMARY_HEADINGS = [
  "## Topics covered",
  "## Where your reasoning became clearer",
  "## What may be worth revisiting",
  "## A question to carry forward",
  "## About this summary",
] as const;

function transcriptTopics(messages: SummaryMessage[]) {
  const transcript = messages.map((message) => message.content).join(" ").toLowerCase();
  const topics: string[] = [];
  if (/assignment|instruction|requirement|rubric|learning outcome|skill/.test(transcript)) {
    topics.push("The assignment requirements, assessed skills, and an appropriate place to begin");
  }
  if (/complex social|complicated|chosen system|candidate system|considering/.test(transcript)) {
    topics.push("Testing whether a possible system is genuinely complex and social");
  }
  if (/micro|meso|macro|agent|attribute|decompos/.test(transcript)) {
    topics.push("Agents, attributes, interactions, and levels of system analysis");
  }
  if (/emergent/.test(transcript)) {
    topics.push("Emergent properties and how interactions may produce them");
  }
  if (/evidence|source|citation|apa|reference/.test(transcript)) {
    topics.push("Evidence, attribution, and professional presentation requirements");
  }
  return topics.slice(0, 4);
}

function lastPersistedQuestion(messages: SummaryMessage[]) {
  const assistantText = messages
    .filter((message) => message.role === "assistant")
    .map((message) => message.content.replace(/\[[A-Z_]+:[^\]]*\]/g, "").replace(/[*_#]/g, ""))
    .join("\n");
  const questions = assistantText.match(/[^\n.!?][^\n?]{5,280}\?/g) ?? [];
  return questions.at(-1)?.trim() ?? "What is the next decision or explanation you need to make in your own words?";
}

function conservativeLearnerSummary(
  messages: SummaryMessage[],
  unresolvedMisconceptions: Array<{ topicThread: string; description: string }>
) {
  const learnerTurns = messages.filter((message) => message.role === "user").length;
  const topics = transcriptTopics(messages);
  const revisit = unresolvedMisconceptions.length
    ? unresolvedMisconceptions
        .slice(0, 3)
        .map((item) => `- ${item.description}`)
        .join("\n")
    : "- Continue from the last unanswered question before drawing conclusions about understanding or progress.";

  return `## Topics covered
${(topics.length ? topics : ["The learner's current question and next step"]).map((topic) => `- ${topic}`).join("\n")}

## Where your reasoning became clearer
- This ${learnerTurns === 1 ? "brief interaction contains one learner contribution" : `conversation contains ${learnerTurns} learner contributions`}; the persisted record does not yet provide enough validated evidence to claim that the learner's reasoning became clearer.

## What may be worth revisiting
${revisit}

## A question to carry forward
${lastPersistedQuestion(messages)}

## About this summary
This AI-generated summary may be incomplete or inaccurate; you can add a reflection or correction before your instructor reviews it.

AI_thena withheld a stronger progress claim because the generated summary did not meet its transcript-validation rules.`;
}

export function validateLearnerSummary(
  generated: string,
  messages: SummaryMessage[],
  unresolvedMisconceptions: Array<{ topicThread: string; description: string }>
) {
  const learnerTurns = messages.filter((message) => message.role === "user").length;
  const firstHeading = generated.indexOf(SUMMARY_HEADINGS[0]);
  const prefix = firstHeading >= 0 ? generated.slice(0, firstHeading).trim() : generated.trim();
  const allHeadingsPresent = SUMMARY_HEADINGS.every(
    (heading, index) => generated.indexOf(heading) >= 0 &&
      (index === 0 || generated.indexOf(heading) > generated.indexOf(SUMMARY_HEADINGS[index - 1]))
  );
  const inventedDialogue = /(?:^|\n)\s*(?:Student|Learner|Tutor|AI_thena)\s*:/i.test(generated);

  if (learnerTurns < 3 || firstHeading < 0 || prefix || !allHeadingsPresent || inventedDialogue) {
    return conservativeLearnerSummary(messages, unresolvedMisconceptions);
  }

  return generated.slice(firstHeading).trim();
}

export interface LearnerReflectionInput {
  changedThinking: string;
  supportedClaim: string;
  remainingUncertainty: string;
  nextStep: string;
  summaryAnnotation: string;
  summaryContested: boolean;
}

export function normalizeLearnerReflection(
  value: Partial<LearnerReflectionInput>
): LearnerReflectionInput {
  const clean = (item: unknown) =>
    typeof item === "string" ? item.trim().slice(0, 2000) : "";

  return {
    changedThinking: clean(value.changedThinking),
    supportedClaim: clean(value.supportedClaim),
    remainingUncertainty: clean(value.remainingUncertainty),
    nextStep: clean(value.nextStep),
    summaryAnnotation: clean(value.summaryAnnotation),
    summaryContested: value.summaryContested === true,
  };
}

export function hasLearnerReflection(value: LearnerReflectionInput): boolean {
  return Boolean(
    value.changedThinking ||
    value.supportedClaim ||
    value.remainingUncertainty ||
    value.nextStep ||
    value.summaryAnnotation ||
    value.summaryContested
  );
}
