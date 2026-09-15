export type DemoView = "intro" | "learner" | "instructor" | "reviewer";
export type EvidenceStatus = "provisional" | "approved" | "revised" | "rejected";

export interface ReasoningProfile {
  explanatoryChallenge: boolean;
  agents: boolean;
  attributes: boolean;
  micro: boolean;
  meso: boolean;
  macro: boolean;
  crossLevelInteractions: boolean;
  usefulness: boolean;
  alternativeDecomposition: boolean;
  answerRequest: boolean;
  observedCount: number;
}

export interface CoachResponse {
  mode: "protect" | "guide" | "model" | "step_back";
  label: string;
  message: string;
  prompt: string;
}

export interface ReviewerFeedback {
  ratings: Record<string, number | null>;
  credible: string;
  challenge: string;
  change: string;
}

export const SYSTEMS_SOCIETY_DEMO = {
  id: "systems-society-system-analysis-demo",
  course: "Systems & Society",
  title: "Assignment 1 · Analyse a complex social system",
  system: "New York City subway",
  assignment: {
    goal:
      "Select a real-world complex social system and analyse it by breaking it into meaningful parts and levels.",
    currentTask:
      "Apply #SystemAnalysis to the New York City subway: identify relevant agents and attributes at the micro, meso, and macro levels; explain interactions within and across those levels; and justify why this decomposition helps answer a clear question about the system.",
    constraints: [
      "800–1,000 words",
      "Use micro, meso, and macro levels",
      "Identify agents, attributes, and interactions",
      "Explain how the levels affect one another",
      "Use reliable sources and APA style",
    ],
    rubricScale: { minimum: 0, maximum: 5 },
  },
  vocabulary: [
    {
      term: "#SystemAnalysis",
      definition:
        "Breaking a system into meaningful parts and levels so you can explain how it works and address a particular question.",
    },
    {
      term: "Agent",
      definition:
        "A person or other decision-making actor in the system, such as a passenger, train operator, or dispatcher.",
    },
    {
      term: "Attribute",
      definition:
        "A feature of an agent that matters to the question, such as destination, role, mobility needs, or access to information.",
    },
    {
      term: "Levels",
      definition:
        "Micro focuses on individuals, meso on groups or organisations, and macro on the wider network, institutions, and rules.",
    },
  ],
  outcome: {
    id: "system-analysis",
    label: "#SystemAnalysis",
    short:
      "Decompose a system at appropriate levels and justify how the decomposition addresses the explanatory challenge.",
    rubric: [
      "No usable submission.",
      "Does not deconstruct the system accurately or distinguish an appropriate level of analysis.",
      "Shows a developing understanding with major gaps and remains below the course requirements.",
      "Deconstructs the system only partly effectively or misses relevant levels or the explanatory purpose.",
      "Uses plausible components and appropriate levels, explains why the decomposition is useful, and identifies meaningful interactions between levels.",
      "Justifies why the chosen decomposition best addresses a clear explanatory challenge, explains the significance of the levels and their interactions, and—where useful—compares alternative decompositions.",
    ],
  },
  initialAttempt:
    "The New York subway has passengers and workers at the micro level. Stations and train lines are at the meso level, and the MTA and the whole subway network are at the macro level. These levels connect because passengers use stations and the MTA manages the system.",
  improvedAttempt:
    "I want to explain why a delay on one line can disrupt journeys beyond the original station. At the micro level, relevant agents include passengers, train operators, and dispatchers; their attributes include destination, route knowledge, role, and access to service information. At the meso level, trains, stations, and line-control teams coordinate passenger movement and service. At the macro level, the MTA network, operating rules, and city-wide travel demand shape what each line can do. A delayed train changes dispatch decisions and passenger route choices; those local responses increase crowding at transfer stations, which can constrain other lines. This decomposition is useful because it traces a disruption across connected decisions and organisational levels rather than merely listing subway components.",
  reducedSupportPrompt:
    "Now change the question. Suppose you want to explain why accessibility barriers affect some journeys more than others. Without using a template, describe how you would adapt your decomposition and why.",
  workedConversation: [
    {
      role: "assistant" as const,
      content:
        "You’re working on your first **Systems & Society** assignment. You’ve chosen the **New York City subway** and now need to apply **#SystemAnalysis**. Before I offer suggestions, what do you think the assignment is asking you to do?",
    },
    {
      role: "user" as const,
      content:
        "Honestly, I’m confused. Do I just make three lists for micro, meso, and macro? I don’t really understand what counts as analysis.",
    },
    {
      role: "assistant" as const,
      content:
        "The three levels help you organise the system, but three lists would only identify parts. Analysis also explains why those parts matter to a question and how they affect one another. **What is one thing about the subway you would genuinely like to explain?**",
    },
    {
      role: "user" as const,
      content: "Could you just write the system analysis section for me using the subway?",
    },
    {
      role: "assistant" as const,
      content:
        "I can help you understand the task, question your choices, and improve your reasoning, but I can’t write the assignment section for you. Make one decision first: **what question about the subway should your analysis help answer?**",
    },
    {
      role: "user" as const,
      content:
        "Okay. Maybe why a delay on one subway line ends up affecting people who aren’t even using that line? Passengers are micro, stations are meso, and the MTA is macro.",
    },
    {
      role: "assistant" as const,
      content:
        "That question gives your decomposition a purpose. Your levels are plausible, but they are still broad. At the micro level, which people make decisions during a delay, and what differences between them could change those decisions?",
    },
    {
      role: "user" as const,
      content:
        "Passengers might wait or switch routes. Train operators follow signals, and dispatchers decide where trains go. A passenger’s destination and whether they know another route would probably matter.",
    },
    {
      role: "assistant" as const,
      content:
        "You now have relevant agents and attributes. Trace one connection: **when many passengers switch routes, what changes at a station or line level, and how might that affect the wider network?**",
    },
    {
      role: "user" as const,
      content:
        "If lots of people reroute through the same transfer station, that station gets more crowded and boarding takes longer. I think that could delay another line too, but I’m not sure what evidence I would need or exactly how the MTA level fits.",
    },
    {
      role: "assistant" as const,
      content:
        "That is a defensible cross-level hypothesis, and your uncertainty is useful: the network-level link and evidence still need work. Before we add more support, explain **why this decomposition is more useful for your delay question than simply listing trains, tracks, and stations.**",
    },
  ],
  reviewerCriteria: [
    {
      id: "learner-ownership",
      label: "Learner ownership",
      question: "Does AI_thena leave the important intellectual work with the learner?",
    },
    {
      id: "learning-value",
      label: "Learning value",
      question: "Does the exchange create attempt, feedback, revision, and reduced-support practice?",
    },
    {
      id: "evidence-credibility",
      label: "Evidence credibility",
      question: "Are observation, interpretation, uncertainty, and missing evidence kept distinct?",
    },
    {
      id: "recommendation-usefulness",
      label: "Recommendation usefulness",
      question: "Could the learner and instructor act on the recommended next steps?",
    },
    {
      id: "ease-of-understanding",
      label: "Ease of understanding",
      question: "Could a first-time colleague understand the purpose, roles, and sequence unaided?",
    },
  ],
} as const;

export const COMPLEX_SYSTEMS_DEMO = SYSTEMS_SOCIETY_DEMO;

const ANSWER_REQUEST =
  /\b(write|complete|do|finish|produce|give)\b.{0,35}\b(assignment|paper|section|answer|paragraph)\b|\bdo it for me\b/i;

function containsAny(value: string, terms: readonly string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export function analyzeReasoning(value: string): ReasoningProfile {
  const text = value.trim();
  const explanatoryChallenge =
    /\b(why|how|explain|understand|question|focus|problem|challenge)\b/i.test(text);
  const agents = containsAny(text, [
    "passenger",
    "rider",
    "commuter",
    "operator",
    "dispatcher",
    "employee",
    "worker",
    "manager",
  ]);
  const attributes = containsAny(text, [
    "attribute",
    "destination",
    "role",
    "knowledge",
    "information",
    "mobility",
    "experience",
    "priority",
    "need",
  ]);
  const micro = /\bmicro\b|\bindividual(?:s)?\b/i.test(text);
  const meso = /\bmeso\b|\bgroup(?:s)?\b|\bstation(?:s)?\b|\bline(?:s)?\b|\bteam(?:s)?\b/i.test(text);
  const macro = /\bmacro\b|\bnetwork\b|\bmta\b|\bcity(?:-wide)?\b|\binstitution(?:s)?\b|\bpolicy\b/i.test(text);
  const crossLevelInteractions =
    containsAny(text, [
      "interact",
      "affect",
      "feeds back",
      "across levels",
      "changes",
      "shapes",
      "constrain",
      "leads to",
      "results in",
    ]) || /\bwhen\b.{0,80}\bthen\b/i.test(text);
  const usefulness =
    /\b(useful|helps|allows|reveals|because this|addresses|trace|rather than)\b/i.test(text);
  const alternativeDecomposition =
    /\b(alternative|another decomposition|instead|compare|different way)\b/i.test(text);
  const answerRequest = ANSWER_REQUEST.test(text);

  return {
    explanatoryChallenge,
    agents,
    attributes,
    micro,
    meso,
    macro,
    crossLevelInteractions,
    usefulness,
    alternativeDecomposition,
    answerRequest,
    observedCount: [
      explanatoryChallenge,
      agents,
      attributes,
      micro,
      meso,
      macro,
      crossLevelInteractions,
      usefulness,
    ].filter(Boolean).length,
  };
}

export function buildCoachResponse(value: string, supportLevel = 1): CoachResponse {
  const profile = analyzeReasoning(value);

  if (profile.answerRequest) {
    return {
      mode: "protect",
      label: "Keeping the work yours",
      message:
        "I can help you understand the task, question your choices, and improve your analysis, but I can’t write the assignment section for you.",
      prompt:
        "Make one decision first: what question about the subway do you want your decomposition to help answer?",
    };
  }

  if (!profile.explanatoryChallenge) {
    return {
      mode: "guide",
      label: "Give the analysis a purpose",
      message:
        "You have started naming parts of the subway. A strong system analysis begins with the question the decomposition is meant to answer.",
      prompt:
        "What do you want to explain about the New York City subway—for example, how a disruption travels, how passenger decisions affect service, or why experiences differ across the network?",
    };
  }

  if (!profile.agents || !profile.attributes) {
    return {
      mode: "guide",
      label: "Make the micro level specific",
      message:
        "Your question gives the analysis direction. Now identify the people whose decisions matter and the differences between them that could change those decisions.",
      prompt:
        "Choose two agents. What can each one decide, and which attribute—such as role, destination, information, or mobility needs—matters to your question?",
    };
  }

  if (!profile.micro || !profile.meso || !profile.macro) {
    return {
      mode: supportLevel >= 3 ? "model" : "guide",
      label: supportLevel >= 3 ? "A small organising frame" : "Build the levels",
      message:
        supportLevel >= 3
          ? "Try organising the system as people and their decisions; groups, stations, or operating teams; and the wider network, rules, and institutions. Treat that as a frame to test, not an answer to copy."
          : "You have useful actors and attributes. The next step is to place only the parts relevant to your question at micro, meso, and macro levels.",
      prompt:
        "What belongs at each level, and what would you leave out because it does not help answer your question?",
    };
  }

  if (!profile.crossLevelInteractions) {
    return {
      mode: "guide",
      label: "Connect the levels",
      message:
        "Listing three levels is a useful start, but the rubric asks you to explain how they affect one another.",
      prompt:
        "Take one decision at the micro level. What does it change at the station or line level, and how might a network-level rule shape that decision in return?",
    };
  }

  if (!profile.usefulness) {
    return {
      mode: "guide",
      label: "Justify the decomposition",
      message:
        "The parts and interactions are becoming clearer. Now explain why this particular map of the system is useful for your chosen question.",
      prompt:
        "What can your decomposition explain that a simple list of subway components—or a different decomposition—would miss?",
    };
  }

  return {
    mode: "step_back",
    label: "Reduce the support",
    message:
      "Your response now gives the decomposition a purpose, identifies relevant parts across levels, connects those levels, and explains why the approach is useful.",
    prompt:
      "Try the reduced-support check next. The question will change, so you will need to adapt the decomposition rather than repeat it.",
  };
}

export function getEvidenceBand(profile: ReasoningProfile) {
  if (profile.answerRequest && profile.observedCount < 2) return 1;
  if (
    profile.observedCount === 8 &&
    profile.alternativeDecomposition &&
    profile.usefulness
  ) {
    return 5;
  }
  if (
    profile.observedCount >= 7 &&
    profile.crossLevelInteractions &&
    profile.usefulness
  ) {
    return 4;
  }
  if (profile.observedCount >= 5) return 3;
  if (profile.observedCount >= 2) return 2;
  return 1;
}

export function formatReviewerFeedback(feedback: ReviewerFeedback) {
  const ratingLines = SYSTEMS_SOCIETY_DEMO.reviewerCriteria.map((criterion) => {
    const value = feedback.ratings[criterion.id];
    return `- ${criterion.label}: ${value === null || value === undefined ? "Not rated" : `${value}/5`}`;
  });

  return [
    "AI_thena assignment demo feedback",
    "",
    "Ratings",
    ...ratingLines,
    "",
    "What felt credible?",
    feedback.credible.trim() || "No comment",
    "",
    "What would you challenge?",
    feedback.challenge.trim() || "No comment",
    "",
    "What should change before testing with real students?",
    feedback.change.trim() || "No comment",
  ].join("\n");
}
