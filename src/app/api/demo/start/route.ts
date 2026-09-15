import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { ensureNormalizedEvidenceDefinitions } from "@/lib/evidence-definitions";
import { createLearnerCapability } from "@/lib/learner-capability";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { SYSTEMS_SOCIETY_DEMO } from "@/lib/demo/complex-systems-demo";

export const DEMO_SESSION_NAME_PREFIX = "AI_thena colleague demo ·";

const COURSE_READING = `
#SystemAnalysis

Analyze and apply decompositions of systems into constituent parts at multiple levels of analysis.

Complex systems can be deconstructed in different ways that define both the scope of the system and the relevant attributes of its components. The key task is to conceptualize the constituent parts in several ways and choose or synthesize the mapping that best addresses the explanatory challenge.

In social systems, analysis can distinguish an individual or micro level, a group or organizational meso level, and a wider system or macro level. An explanation at only one level may be insufficient. A strong multilevel analysis identifies relevant agents, their attributes, interactions within levels, and consequential interactions between levels.

Example of the reasoning move: A hospital trying to reduce spending could first be decomposed by department. That view might reveal communication patterns but hide duplicated education-campaign work inside each department. Decomposing the same hospital by function could expose the duplication. The point is not merely to list parts; it is to justify why a particular decomposition helps answer a clearly stated question and, when useful, compare it with an alternative.
`;

const ASSIGNMENT_INSTRUCTIONS = `
Assignment 1 - Complex Social System Analysis

Goal: Individually conduct a complex social-system analysis using reliable resources and all relevant learning outcomes, concepts, and ideas covered in Unit 1.

Step 1 - Select and introduce the system
Choose a complex social system that was not discussed in class. Introduce it for an audience with little prior knowledge by explaining its features, interactions, and purpose. Explain how it is complex rather than merely complicated, and state clearly what makes it social.

Step 2 - Break down the system using #SystemAnalysis and #EvidenceBased
Break the chosen system into components. Conduct a multilevel analysis at the micro, meso, and macro levels. Within each level, identify the agents, agent attributes, and interactions among agents. Explain how the levels interact with one another and how the decomposition helps address a clear explanatory challenge. Use reliable pre-class readings, scientific resources, internet sources, or appropriate popular articles. Cite and reference every externally sourced idea in APA style.

Step 3 - Identify and explain an emergent property using #EmergentProperties
Identify an emergent property in the chosen system. Describe the behavior that arises from interactions among agents and explain why and how it emerges. The emergent behavior must occur at the meso or macro level, not at the micro level.

Step 4 - Use APA style and #Professionalism
Use APA style throughout. Include an appropriate title page, leveled headings, in-text citations, and a reference list containing only the sources used. Every in-text citation must have a matching reference. Quotes may not be used. Use one space between sentences, indent paragraphs, and proofread before submitting.

Additional requirements
- Draw the audience's attention to the best applications of the learning outcomes using footnotes. Each footnote should name the relevant learning outcome hashtag and explain the application in two to four sentences.
- Cite and reference all information drawn from external sources, including class readings.
- Include a word count at the end of the main document, before the reference list. The count excludes the title page, footnotes, and reference list.
- Length: 800-1,000 words.
- Weight: 10%.

`;

const LEARNING_OUTCOMES_AND_RUBRICS = `
Assessed learning outcomes and 0-5 criteria

#EvidenceBased - Identify and appropriately structure the information needed to support an argument effectively.
0: No usable submission. 1: Does not identify or use evidence effectively. 2: Developing understanding with major gaps. 3: Evidence is only somewhat accurate, confusingly presented, or weakly evaluated. 4: Appropriate evidence is used clearly and evaluated effectively where relevant. 5: The identification and use of evidence are explained or justified, and evaluations are themselves justified.

#SystemAnalysis - Analyze and apply decompositions of systems into constituent parts at multiple levels of analysis.
0: No usable submission. 1: The system is not deconstructed accurately or appropriate levels are not distinguished. 2: Developing understanding with major gaps. 3: The decomposition is only partly effective or misses relevant levels or the explanatory challenge. 4: Plausible parts and appropriate levels are used, the decomposition's usefulness is described, and significant multilevel interactions are identified where relevant. 5: The decomposition is justified against a clear explanatory challenge, relevant levels and interactions are explained, and alternative decompositions are compared where useful.

#EmergentProperties - Identify emergent properties of complex systems and discern their causes.
0: No usable submission. 1: The concept is not applied accurately. 2: Developing understanding with major gaps. 3: Emergence is misdescribed or its proposed causes are weak. 4: An emergent property and plausible causes are accurately identified and its significance is addressed where relevant. 5: The classification and causal explanation are justified, significance is explained, and plausible conditions or predictions are developed where relevant.

#Professionalism - Ensure that communication follows established guidelines and uses a careful editing process.
0: No usable submission. 1: Professional expectations for tone, attribution, formatting, guidelines, or proofreading are not met. 2: Developing understanding with major gaps. 3: Some expectations are met but notable problems remain. 4: Communication is professional, sources are attributed, conventions are followed, and the work is proofread. 5: Nuanced conventions are applied appropriately for the audience, context, and discipline.

Additional required skill: #Audience - Explain the system for a reader with little prior knowledge and use learning-outcome footnotes to draw attention to the strongest applications.
`;

const PROTECTED_TARGET = `
Protected learner-authored target: do not write, complete, draft, supply, or provide any answer, section, paragraph, outline, decomposition, emergent-property analysis, or final prose for the learner's chosen system. Coach the learner without disclosing or reconstructing a submission they could hand in as their own. You may clarify instructions, explain concepts, offer analog examples about a different system, critique learner-authored material, or model one bounded reasoning move that the learner must then adapt.
`;

const DEMO_TUTOR_VOICE = `
LEARNER-FACING VOICE AND EXPERIENCE
- Lead with the answer, distinction, or next step the learner actually needs. Do not begin with generic praise or a recap of everything they said.
- Use ordinary language before course shorthand. If a term matters, explain it through what the learner will need to notice, decide, compare, or revise.
- Name the learner's actual activity accurately. They may be asking for orientation, checking a concept, choosing a system, testing an idea, or revising reasoning. Do not describe every contribution as "reasoning."
- Make the mechanism visible. Say what is sound, what is missing, why it matters for this assignment, and what the learner should do next.
- Treat the learner as the author and decision-maker. Invite them to explain, choose, test, revise, or defend; never imply that polished AI language is evidence of their capability.
- Keep one coherent thread. Answer the present need, then ask one purposeful question that creates the next useful piece of learner work.
- Be warm through usefulness, attention, and honest correction. Avoid cheerleading, consultant language, institutional filler, and exaggerated claims about progress.
- Sound like a thoughtful practitioner with a point of view, not an automated rubric or optimization system. Keep responses concise enough to use without flattening a necessary distinction.
`;

const CHECKPOINTS = [
  {
    orderIndex: 0,
    prompt: "Can the learner explain what the assignment requires and identify an appropriate place to begin?",
    processLevel: "understand",
    expectations: [
      "Distinguishes the assignment's main stages, learning outcomes, and submission constraints.",
      "Identifies the next decision or concept they need to work on rather than merely repeating instructions.",
    ],
    misconceptionSeeds: [
      "Treating the task as a generic descriptive report rather than a reasoned complex-system analysis.",
    ],
  },
  {
    orderIndex: 1,
    prompt: "Can the learner select or evaluate a system and justify why it is both complex and social?",
    processLevel: "evaluate",
    expectations: [
      "Identifies interacting people or social actors and explains what makes the system social.",
      "Uses interaction, feedback, adaptation, unpredictability, or emergence to distinguish complexity from mere complication.",
    ],
    misconceptionSeeds: [
      "Assuming that a system is complex merely because it is large or contains many parts.",
    ],
  },
  {
    orderIndex: 2,
    prompt: "What explanatory question gives the learner's decomposition a clear purpose?",
    processLevel: "integrate",
    expectations: [
      "States a specific question about the selected system.",
      "Explains how the question determines which parts, attributes, and levels are relevant.",
    ],
    misconceptionSeeds: [
      "Treating system analysis as an inventory of components without an explanatory purpose.",
    ],
  },
  {
    orderIndex: 3,
    prompt: "How do relevant agents, attributes, and interactions operate within and across micro, meso, and macro levels?",
    processLevel: "integrate",
    expectations: [
      "Identifies relevant agents and attributes rather than only physical components.",
      "Traces consequential interactions within and between appropriate levels.",
    ],
    misconceptionSeeds: [
      "Naming three levels without explaining interactions within or between them.",
    ],
  },
  {
    orderIndex: 4,
    prompt: "Can the learner explain an emergent property and how interactions in the system produce it?",
    processLevel: "explain",
    expectations: [
      "Identifies a defensible property at the meso or macro level.",
      "Explains how specific lower-level interactions plausibly give rise to that property.",
    ],
    misconceptionSeeds: [
      "Treating an individual characteristic, simple total, or predictable output as an emergent property.",
    ],
  },
  {
    orderIndex: 5,
    prompt: "Can the learner justify their evidence choices and identify the professional requirements that apply?",
    processLevel: "evaluate",
    expectations: [
      "Connects relevant and reliable evidence to claims or assumptions that require support.",
      "Recognizes APA attribution, no quotations, learning-outcome footnotes, word count, and proofreading requirements.",
    ],
    misconceptionSeeds: [
      "Treating evidence and APA conventions as an end-stage formatting exercise rather than part of the reasoning process.",
    ],
  },
  {
    orderIndex: 6,
    prompt: "Can the learner reapply a relevant reasoning move to their system with less support?",
    processLevel: "evaluate",
    expectations: [
      "Adapts the relevant concept or analysis to a changed question or condition.",
      "Explains the adaptation without reproducing the earlier scaffold or accepting AI language unchanged.",
    ],
    misconceptionSeeds: [
      "Repeating a prior structure without considering how the new question changes what is relevant.",
    ],
  },
] as const;

async function createDemoSession() {
  const runId = randomBytes(8).toString("hex");
  const session = await prisma.session.create({
    data: {
      accessCode: `SYSTEMS-DEMO-${runId.toUpperCase()}`,
      name: `${DEMO_SESSION_NAME_PREFIX} ${SYSTEMS_SOCIETY_DEMO.course}`,
      description: SYSTEMS_SOCIETY_DEMO.assignment.goal,
      courseContext:
        "The learner is taking Systems & Society and has not necessarily selected a system or understood the assignment yet. Begin by helping them locate where they are: understanding the task, learning the concepts and skills, choosing or checking a system, or discussing work they already created. This is assignment support, not a request to produce the paper.",
      learningGoal: SYSTEMS_SOCIETY_DEMO.assignment.currentTask,
      learningOutcomes:
        "#EvidenceBased - identify and structure relevant evidence\n#SystemAnalysis - analyze decompositions at multiple levels\n#EmergentProperties - identify emergent properties and their causes\n#Professionalism - follow academic and communication conventions\n#Audience - explain the system for an unfamiliar reader",
      maxExchanges: 10,
      stance: "mentor",
      sessionPurpose: "after_class",
      planningOpeningQuestion:
        "Where would you like to begin: understanding the assignment, explaining the key concepts and skills, choosing or checking a system, or discussing an idea or draft you already have?",
      planningTaskInstructions:
        `Orient before demanding an attempt. Do not assume the learner has chosen a system or understands the assignment. Route support according to their need, then ask for their thinking, diagnose what is missing, and offer the smallest useful scaffold. Support any defensible complex social system. Explain the full assignment, learning outcomes, concepts, and rubric when asked. Preserve learner ownership and do not write the assignment for them.\n\n${DEMO_TUTOR_VOICE}`,
      planningIntendedOutput:
        "Learner-authored progress appropriate to their starting point: an accurate task map, a justified system choice, clarified foundational concepts, a question-driven multilevel analysis, an emergent-property explanation, evidence decisions, or a revision of their own work.",
      readings: {
        create: [
          {
            filename: "SystemAnalysis-course-definition.txt",
            content: COURSE_READING,
          },
          {
            filename: "Assignment-1-instructions.txt",
            content: ASSIGNMENT_INSTRUCTIONS,
          },
          {
            filename: "Assignment-1-learning-outcomes-and-rubrics.txt",
            content: LEARNING_OUTCOMES_AND_RUBRICS,
          },
        ],
      },
      assessments: {
        create: {
          filename: "Assignment-1-protected-target.txt",
          content: PROTECTED_TARGET,
        },
      },
      checkpoints: {
        create: CHECKPOINTS.map((checkpoint) => ({
          orderIndex: checkpoint.orderIndex,
          prompt: checkpoint.prompt,
          processLevel: checkpoint.processLevel,
          expectations: JSON.stringify(checkpoint.expectations),
          misconceptionSeeds: JSON.stringify(checkpoint.misconceptionSeeds),
        })),
      },
    },
  });

  await ensureNormalizedEvidenceDefinitions(session.id);
  return session;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, {
    scope: "assignment-demo-start",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      {
        mode: "unavailable",
        reason: "MODEL_NOT_CONFIGURED",
        message:
          "Live AI_thena is not configured on this server. Add ANTHROPIC_API_KEY to use the interactive experience.",
      },
      { status: 503, headers: rateLimit.headers }
    );
  }

  try {
    await ensureDatabaseReady();
    const session = await createDemoSession();
    const capability = createLearnerCapability();
    const learnerSuffix = randomBytes(3).toString("hex").toUpperCase();
    const studentSession = await prisma.studentSession.create({
      data: {
        sessionId: session.id,
        studentName: `Demo learner ${learnerSuffix}`,
        accessTokenHash: capability.tokenHash,
      },
    });

    return NextResponse.json(
      {
        mode: "live",
        sessionId: session.id,
        studentSessionId: studentSession.id,
        capabilityToken: capability.token,
        maxExchanges: session.maxExchanges,
      },
      { status: 201, headers: rateLimit.headers }
    );
  } catch (error) {
    console.error("Failed to start assignment demo:", error);
    return NextResponse.json(
      {
        mode: "unavailable",
        reason: "START_FAILED",
        message: "AI_thena could not create the live demo session. Please try again.",
      },
      { status: 500, headers: rateLimit.headers }
    );
  }
}
