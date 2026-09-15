"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  SYSTEMS_SOCIETY_DEMO,
  analyzeReasoning,
  formatReviewerFeedback,
  getEvidenceBand,
  type DemoView,
  type ReasoningProfile,
} from "@/lib/demo/complex-systems-demo";

type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ConnectionMode = "starting" | "live" | "unavailable" | "worked";

type EvidenceSnapshot = {
  source: "live_ai_thena";
  generatedAt: string;
  learner: {
    name: string;
    startedAt: string;
    endedAt: string | null;
    summary: string | null;
  };
  messages: Array<DemoMessage & {
    topicThread: string | null;
    attemptNumber: number | null;
    isGenuineAttempt: boolean | null;
    mode: string | null;
    questionType: string | null;
    feedbackType: string | null;
    engagementFlag: string | null;
  }>;
  checkpoints: Array<{
    id: string;
    prompt: string;
    processLevel: string;
    status: string;
    turnsSpent: number;
    evidenceNotes: string | null;
  }>;
  misconceptions: Array<{
    id: string;
    description: string;
    studentMessage: string;
    resolved: boolean;
    severity: string;
  }>;
  diagnostics: Array<{
    id: string;
    turnIndex: number;
    engagementFlag: string;
  }>;
  evidenceSignals: Array<{
    id: string;
    signalType: string;
    claim: string;
    status: string;
    confidenceLevel: string;
    confidenceRationale: string;
    limitations: string;
    missingEvidence: string;
    contradictoryEvidence: string;
    opportunitySummary: string;
    citations: Array<{ citationType: string; quotedText: string }>;
  }>;
  loAssessments: Array<{
    learningOutcome: string;
    status: string;
    confidence: string;
    evidenceSummary: string | null;
  }>;
  teachingBrief: {
    formativeUse?: { statement?: string; gradingBoundary?: string };
    evidenceMap?: {
      items?: Array<{
        id: string;
        label: string;
        classificationLabel: string;
        confidence: { level: string; rationale: string };
        missingEvidence: string[];
        evidenceReferences: Array<{ quotedText: string }>;
      }>;
    };
    suggestedTeachingMoves?: Array<{
      id: string;
      whatToAddress: string;
      whyItMatters: string;
      confidence: string;
    }>;
  } | null;
  reportError: string | null;
  limitations: string[];
};

const PROFILE_ITEMS: Array<{
  key: keyof ReasoningProfile;
  label: string;
  description: string;
}> = [
  {
    key: "explanatoryChallenge",
    label: "Clear question",
    description: "The decomposition has a specific explanatory purpose.",
  },
  {
    key: "agents",
    label: "Relevant agents",
    description: "The learner identifies decision-making actors.",
  },
  {
    key: "attributes",
    label: "Relevant attributes",
    description: "Differences between agents are connected to the question.",
  },
  {
    key: "micro",
    label: "Micro level",
    description: "Individual actors and decisions are represented.",
  },
  {
    key: "meso",
    label: "Meso level",
    description: "Groups, stations, lines, or operating teams are represented.",
  },
  {
    key: "macro",
    label: "Macro level",
    description: "The wider network, institution, or rules are represented.",
  },
  {
    key: "crossLevelInteractions",
    label: "Connections across levels",
    description: "The response explains how one level affects another.",
  },
  {
    key: "usefulness",
    label: "Justified decomposition",
    description: "The learner explains why this map helps answer the question.",
  },
];

const LEARNER_NEXT_STEPS: Partial<Record<keyof ReasoningProfile, string>> = {
  explanatoryChallenge:
    "Ask the learner to state the question their decomposition is meant to answer, then explain how that question determines what belongs in the analysis.",
  agents:
    "Ask the learner to identify the people who make consequential decisions in this system and explain why those actors matter to the question.",
  attributes:
    "Ask the learner which differences between agents—such as destination, role, information, or mobility needs—could change their decisions.",
  micro:
    "Ask the learner to identify the individual actors and decisions that belong at the micro level.",
  meso:
    "Ask the learner to identify the relevant groups, stations, lines, or operating teams at the meso level.",
  macro:
    "Ask the learner to identify the network, institutional rules, or city-wide conditions that belong at the macro level.",
  crossLevelInteractions:
    "Ask the learner to trace one decision from the micro level into a station or line-level effect, then explain how a network-level rule shapes it in return.",
  usefulness:
    "Ask the learner what this decomposition reveals that a simple list of subway components—or a different decomposition—would miss.",
};

function messageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialMessages(): DemoMessage[] {
  return [];
}

export function AssignmentDemo() {
  const [view, setView] = useState<DemoView>("intro");
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [messages, setMessages] = useState<DemoMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("starting");
  const [studentSessionId, setStudentSessionId] = useState<string | null>(null);
  const [capabilityToken, setCapabilityToken] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [supportLevel, setSupportLevel] = useState(1);
  const [transferStart, setTransferStart] = useState<number | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [visitedInstructor, setVisitedInstructor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceSnapshot, setEvidenceSnapshot] = useState<EvidenceSnapshot | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const started = useRef(false);

  const learnerMessages = useMemo(
    () => messages.filter((message) => message.role === "user"),
    [messages]
  );
  const firstProfile = useMemo(
    () => analyzeReasoning(learnerMessages[0]?.content ?? ""),
    [learnerMessages]
  );
  const currentProfile = useMemo(
    () => analyzeReasoning(learnerMessages.map((message) => message.content).join("\n")),
    [learnerMessages]
  );
  const transferProfile = useMemo(() => {
    if (transferStart === null) return null;
    return analyzeReasoning(
      learnerMessages
        .slice(transferStart)
        .map((message) => message.content)
        .join("\n")
    );
  }, [learnerMessages, transferStart]);

  async function prepareLiveSession() {
    if (started.current) return;
    started.current = true;
    setConnectionMode("starting");
    try {
      const response = await fetch("/api/demo/start", { method: "POST" });
      const data = await response.json();
      if (data.mode === "live" && data.studentSessionId && data.capabilityToken) {
        setStudentSessionId(data.studentSessionId);
        setCapabilityToken(data.capabilityToken);
        setConnectionMode("live");
        const openingResponse = await fetch("/api/demo/opening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentSessionId: data.studentSessionId,
            capabilityToken: data.capabilityToken,
          }),
        });
        const openingData = await openingResponse.json();
        if (!openingResponse.ok || !openingData.opening) {
          throw new Error(openingData.error || "AI_thena could not begin the conversation.");
        }
        setMessages([
          { id: messageId(), role: "assistant", content: openingData.opening },
        ]);
      } else {
        setConnectionMode("unavailable");
        setError(
          data.message ||
            "Live AI_thena is unavailable on this server. You can still inspect the pre-recorded example."
        );
      }
    } catch (sessionError) {
      setConnectionMode("unavailable");
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "Live AI_thena is unavailable on this server."
      );
    }
  }

  function startLearnerExperience() {
    started.current = false;
    setMessages(initialMessages());
    setInput("");
    setConnectionMode("starting");
    setStudentSessionId(null);
    setCapabilityToken(null);
    setIsSending(false);
    setSupportLevel(1);
    setTransferStart(null);
    setSelectedSystem(null);
    setError(null);
    setEvidenceSnapshot(null);
    setEvidenceError(null);
    setView("learner");
    void prepareLiveSession();
  }

  function loadWorkedExample() {
    started.current = false;
    setStudentSessionId(null);
    setCapabilityToken(null);
    setInput("");
    setMessages(
      SYSTEMS_SOCIETY_DEMO.workedConversation.map((message) => ({
        id: messageId(),
        role: message.role,
        content: message.content,
      }))
    );
    setConnectionMode("worked");
    setSupportLevel(3);
    setTransferStart(null);
    setSelectedSystem(SYSTEMS_SOCIETY_DEMO.sampleSystem);
    setError(null);
    setEvidenceSnapshot(null);
    setEvidenceError(null);
    setView("learner");
  }

  async function sendMessage(content: string) {
    const clean = content.trim();
    if (!clean || isSending || connectionMode !== "live") return;

    const userMessage: DemoMessage = {
      id: messageId(),
      role: "user",
      content: clean,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setError(null);

    const assistantId = messageId();
    setMessages((current) => [
      ...current,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    if (studentSessionId && capabilityToken) {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentSessionId,
            capabilityToken,
            messages: nextMessages.map(({ role, content: messageContent }) => ({
              role,
              content: messageContent,
            })),
          }),
        });

        if (!response.ok || !response.body) throw new Error("Live response unavailable");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) {
            const chunk = decoder.decode(result.value, { stream: !done });
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + chunk }
                  : message
              )
            );
          }
        }
      } catch {
        setConnectionMode("unavailable");
        setMessages((current) =>
          current.filter((message) => message.id !== assistantId)
        );
        setError(
          "The live AI response failed. No simulated response has been substituted; you can retry from the beginning or inspect the pre-recorded example."
        );
      } finally {
        setIsSending(false);
      }
      return;
    }
  }

  function beginReducedSupportCheck() {
    if (transferStart === null) setTransferStart(learnerMessages.length);
    void sendMessage(
      selectedSystem
        ? `I’m ready to test my thinking with less support. Give me a changed question about ${selectedSystem} that requires me to reapply the most relevant assignment skill, but do not give me the reasoning or answer.`
        : "I’m ready to test my thinking with less support. Give me a changed complex-social-system example that requires me to reapply the most relevant assignment skill, but do not give me the reasoning or answer."
    );
  }

  function chooseSystem(system: string) {
    const clean = system.trim();
    if (!clean) return;
    setSelectedSystem(clean);
    void sendMessage(
      `I am considering ${clean} for the assignment. Before we assume it is suitable, help me test whether it is genuinely both complex and social. Ask me to make the case rather than deciding for me.`
    );
  }

  async function openInstructor() {
    setVisitedInstructor(true);
    setView("instructor");
    if (
      connectionMode !== "live" ||
      !studentSessionId ||
      !capabilityToken ||
      learnerMessages.length === 0
    ) {
      return;
    }

    setEvidenceLoading(true);
    setEvidenceError(null);
    try {
      const endResponse = await fetch("/api/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentSessionId, capabilityToken }),
      });
      if (!endResponse.ok) {
        throw new Error("AI_thena could not create the learner summary.");
      }

      const evidenceResponse = await fetch("/api/demo/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentSessionId,
          capabilityToken,
          generateReport: true,
        }),
      });
      const evidenceData = await evidenceResponse.json();
      if (!evidenceResponse.ok) {
        throw new Error(evidenceData.error || "AI_thena could not load the evidence.");
      }
      setEvidenceSnapshot(evidenceData as EvidenceSnapshot);
    } catch (snapshotError) {
      setEvidenceError(
        snapshotError instanceof Error
          ? snapshotError.message
          : "AI_thena could not prepare the instructor view."
      );
    } finally {
      setEvidenceLoading(false);
    }
  }

  function resetDemo() {
    started.current = false;
    setView("intro");
    setMessages(initialMessages());
    setInput("");
    setConnectionMode("starting");
    setStudentSessionId(null);
    setCapabilityToken(null);
    setIsSending(false);
    setSupportLevel(1);
    setTransferStart(null);
    setSelectedSystem(null);
    setVisitedInstructor(false);
    setError(null);
    setEvidenceSnapshot(null);
    setEvidenceLoading(false);
    setEvidenceError(null);
    setAssignmentOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#242421]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,112,119,0.09),transparent_36%),radial-gradient(circle_at_85%_16%,rgba(197,148,77,0.12),transparent_30%)]" />
      <div className="relative mx-auto min-h-screen w-full max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-10">
        <header className="flex h-[72px] items-center justify-between border-b border-black/8">
          <button type="button" onClick={() => setView("intro")} className="text-left">
            <span className="font-serif text-[22px] tracking-[-0.02em]">AI_thena</span>
            <span className="ml-3 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71716b] sm:inline">
              Colleague demo
            </span>
          </button>
          {view !== "intro" ? (
            <button
              type="button"
              onClick={resetDemo}
              className="rounded-full border border-black/10 bg-white/55 px-4 py-2 text-xs font-semibold text-[#55554f] transition hover:border-black/20 hover:bg-white"
            >
              Start over
            </button>
          ) : (
            <span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-medium text-[#62625c] shadow-sm ring-1 ring-black/5">
              No login required
            </span>
          )}
        </header>

        {view === "intro" ? (
          <IntroView
            onStart={startLearnerExperience}
            onWorked={loadWorkedExample}
            onAssignment={() => setAssignmentOpen(true)}
          />
        ) : (
          <>
            <JourneyNav
              view={view}
              visitedInstructor={visitedInstructor}
              onLearner={() => setView("learner")}
              onInstructor={() => void openInstructor()}
              onReviewer={() => setView("reviewer")}
            />
            {view === "learner" ? (
              <LearnerView
                messages={messages}
                input={input}
                connectionMode={connectionMode}
                isSending={isSending}
                error={error}
                learnerMessageCount={learnerMessages.length}
                transferStarted={transferStart !== null}
                selectedSystem={selectedSystem}
                onInput={setInput}
                onSend={sendMessage}
                onMoreSupport={() => {
                  setSupportLevel((level) => Math.min(level + 1, 6));
                  void sendMessage(
                    "I’m still struggling. Please give me the next-smallest hint that would help me continue, without doing the reasoning for me."
                  );
                }}
                onReducedSupport={beginReducedSupportCheck}
                onSelectSystem={chooseSystem}
                onInstructor={() => void openInstructor()}
                onAssignment={() => setAssignmentOpen(true)}
                onWorked={loadWorkedExample}
              />
            ) : view === "instructor" ? (
              <InstructorView
                messages={messages}
                firstProfile={firstProfile}
                currentProfile={currentProfile}
                transferProfile={transferProfile}
                connectionMode={connectionMode}
                supportLevel={supportLevel}
                evidenceSnapshot={evidenceSnapshot}
                evidenceLoading={evidenceLoading}
                evidenceError={evidenceError}
                onWorked={loadWorkedExample}
                onLearner={() => setView("learner")}
                onReviewer={() => setView("reviewer")}
                onAssignment={() => setAssignmentOpen(true)}
              />
            ) : (
              <ReviewerView onInstructor={() => setView("instructor")} />
            )}
          </>
        )}
      </div>
      {assignmentOpen ? <AssignmentBrief onClose={() => setAssignmentOpen(false)} /> : null}
    </main>
  );
}

function IntroView({ onStart, onWorked, onAssignment }: { onStart: () => void; onWorked: () => void; onAssignment: () => void }) {
  return (
    <div className="mx-auto max-w-[1180px] pb-20 pt-12 sm:pt-16 lg:pt-20">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-20">
        <section>
          <p className="mb-6 inline-flex rounded-full bg-[#146e73]/10 px-3 py-1.5 text-xs font-bold text-[#146e73]">
            Interactive assignment-support demo
          </p>
          <h1 className="max-w-[820px] font-serif text-[clamp(2.75rem,5.4vw,5.25rem)] leading-[0.98] tracking-[-0.045em] text-[#252521]">
            See how AI could support a learner with an assignment—without doing it for them.
          </h1>
          <p className="mt-7 max-w-2xl text-[18px] leading-8 text-[#62625c]">
            Imagine you are a learner taking <strong className="font-semibold text-[#252521]">Systems &amp; Society</strong>. You are completing your first assignment: choose a complex social system from the real world and analyse it.
          </p>
          <p className="mt-4 max-w-2xl text-[18px] leading-8 text-[#62625c]">
            Begin wherever a learner genuinely might: make sense of the instructions, understand the concepts and skills, choose or check a system, or discuss an idea already in progress. You can choose any suitable system—or use the New York City subway as an optional sample.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#155f64] px-7 text-sm font-bold text-white shadow-[0_18px_45px_rgba(21,95,100,0.22)] transition hover:-translate-y-0.5 hover:bg-[#104f53]"
            >
              Begin as the learner
              <span aria-hidden className="ml-3 text-lg">→</span>
            </button>
            <button
              type="button"
              onClick={onWorked}
              className="min-h-14 rounded-full px-6 text-sm font-semibold text-[#155f64] transition hover:bg-white/65"
            >
              View a worked conversation
            </button>
          </div>
          <button type="button" onClick={onAssignment} className="mt-4 text-xs font-semibold text-[#5e6763] underline decoration-black/20 underline-offset-4 hover:text-[#155f64]">
            Review the assignment instructions first
          </button>
          <p className="mt-4 text-xs text-[#777770]">About 10 minutes · type freely · no account or preparation</p>
        </section>

        <aside className="overflow-hidden rounded-[28px] bg-[#242a29] text-white shadow-[0_32px_80px_rgba(40,40,35,0.18)]">
          <div className="border-b border-white/10 p-7 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9ed2cf]">The scenario</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.025em]">Your first Systems &amp; Society assignment</h2>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-white/10">
            <ScenarioItem number="01" label="Course" value="Systems & Society" />
            <ScenarioItem number="02" label="Assignment" value="Analyse a complex social system" />
            <ScenarioItem number="03" label="System" value="The learner chooses" />
            <ScenarioItem number="04" label="Assessed skills" value="Four learning outcomes + #Audience" />
          </dl>
          <div className="bg-[#1d2221] p-7 sm:p-8">
            <p className="flex gap-3 text-sm leading-6 text-white/76">
              <span aria-hidden className="mt-0.5 text-[#d6ad68]">✦</span>
              <span>
                AI_thena will ask you to think first, provide only the support you need, and help you improve your reasoning. It will not write the assignment.
              </span>
            </p>
            <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-white/60">
              Afterwards, you will see what an instructor could learn from the conversation—and what AI recommends next.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AssignmentBrief({ onClose }: { onClose: () => void }) {
  const [activeOutcomeId, setActiveOutcomeId] = useState<string>(
    SYSTEMS_SOCIETY_DEMO.outcomes[0].id
  );
  const activeOutcome =
    SYSTEMS_SOCIETY_DEMO.outcomes.find(
      (outcome) => outcome.id === activeOutcomeId
    ) ?? SYSTEMS_SOCIETY_DEMO.outcomes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close assignment instructions"
        onClick={onClose}
        className="absolute inset-0 bg-[#18201f]/60 backdrop-blur-sm"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-brief-title"
        className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-[28px] bg-[#fbfaf7] shadow-2xl sm:rounded-[28px]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-black/8 bg-[#fbfaf7]/95 px-6 py-5 backdrop-blur sm:px-9">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#155f64]">Full assignment · source of truth</p>
            <h2 id="assignment-brief-title" className="mt-2 font-serif text-3xl tracking-[-0.025em]">Assignment 1 · Complex social-system analysis</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#eeece6] text-xl text-[#55554f] hover:bg-[#e4e1d8]" aria-label="Close">×</button>
        </header>

        <div className="grid gap-8 px-6 py-7 sm:px-9 sm:py-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div>
            <div className="rounded-2xl bg-[#e9f3f1] p-5 text-sm leading-6 text-[#3f504d]">
              <strong className="block text-[#155f64]">Goal</strong>
              Individually select a real-world complex social system that was not discussed in class, analyse it using reliable resources and the Unit 1 concepts, explain an emergent property, and present the work as a carefully edited APA paper.
            </div>

            <section className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#81745f]">What you need to do</p>
              <div className="mt-4 space-y-3">
                {SYSTEMS_SOCIETY_DEMO.steps.map((step) => (
                  <article key={step.number} className="grid grid-cols-[34px_1fr] gap-4 rounded-2xl border border-black/7 bg-white/70 p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#155f64] text-xs font-bold text-white">{step.number}</span>
                    <div>
                      <h3 className="text-sm font-bold text-[#2d2e2a]">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#66665f]">{step.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-7 border-t border-black/8 pt-7">
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#81745f]">Assessed learning outcomes · select one to see its 0–5 rubric</p>
              <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Learning outcome rubrics">
                {SYSTEMS_SOCIETY_DEMO.outcomes.map((outcome) => (
                  <button
                    key={outcome.id}
                    type="button"
                    role="tab"
                    aria-selected={activeOutcome.id === outcome.id}
                    onClick={() => setActiveOutcomeId(outcome.id)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition ${activeOutcome.id === outcome.id ? "bg-[#155f64] text-white" : "bg-[#efede7] text-[#585953] hover:bg-[#e5e2da]"}`}
                  >
                    {outcome.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#242a29] p-5 text-white" role="tabpanel">
                <h3 className="text-sm font-bold text-[#9ed2cf]">{activeOutcome.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/72">{activeOutcome.short}</p>
                <ol className="mt-5 space-y-3 border-t border-white/10 pt-5">
                  {activeOutcome.rubric.map((descriptor, band) => (
                    <li key={`${activeOutcome.id}-${band}`} className="grid grid-cols-[26px_1fr] gap-3 text-xs leading-5 text-white/68">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-bold text-white">{band}</span>
                      <span>{descriptor}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-4 rounded-2xl border border-[#155f64]/14 bg-[#edf6f4] p-4 text-sm leading-6 text-[#4c5f5c]">
                <strong className="text-[#155f64]">Also required: {SYSTEMS_SOCIETY_DEMO.additionalSkill.label}</strong>
                <span className="mt-1 block">{SYSTEMS_SOCIETY_DEMO.additionalSkill.short}</span>
              </div>
            </section>

            <section className="mt-7 border-t border-black/8 pt-7">
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#81745f]">APA resources named in the assignment</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {SYSTEMS_SOCIETY_DEMO.apaResources.map((resource) => (
                  <li key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noreferrer" className="flex h-full items-center justify-between gap-3 rounded-xl border border-black/8 bg-white/70 px-4 py-3 text-xs font-bold text-[#155f64] transition hover:border-[#155f64]/30 hover:bg-white">
                      {resource.label}<span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="self-start rounded-[22px] bg-[#f0eee8] p-6 lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#81745f]">Submission checklist</p>
            <ul className="mt-5 space-y-3">
              {SYSTEMS_SOCIETY_DEMO.submissionRequirements.map((requirement) => (
                <li key={requirement} className="flex gap-3 text-xs leading-5 text-[#5f6059]">
                  <span aria-hidden className="mt-0.5 text-[#155f64]">✓</span>
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-black/8 pt-5">
              <p className="text-xs font-bold text-[#2d2e2a]">How AI_thena may help</p>
              <p className="mt-2 text-xs leading-5 text-[#696963]">It can clarify instructions, explain concepts with other examples, help test a system choice, question reasoning, or critique learner-authored work. It will not produce a submission-ready section.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ScenarioItem({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <div className="min-h-32 bg-[#242a29] p-6">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/38">{number} · {label}</dt>
      <dd className="mt-3 text-sm font-semibold leading-5 text-white/90">{value}</dd>
    </div>
  );
}

function JourneyNav({
  view,
  visitedInstructor,
  onLearner,
  onInstructor,
  onReviewer,
}: {
  view: DemoView;
  visitedInstructor: boolean;
  onLearner: () => void;
  onInstructor: () => void;
  onReviewer: () => void;
}) {
  const steps = [
    { id: "learner", number: "1", label: "Experience as learner", onClick: onLearner },
    { id: "instructor", number: "2", label: "Inspect as instructor", onClick: onInstructor },
    { id: "reviewer", number: "3", label: "Reflect as colleague", onClick: onReviewer },
  ] as const;
  return (
    <nav aria-label="Demo journey" className="mx-auto flex max-w-[880px] items-center justify-center gap-1 py-7 sm:gap-3">
      {steps.map((step, index) => {
        const active = view === step.id;
        const visited = step.id === "learner" || visitedInstructor || active;
        return (
          <div key={step.id} className="contents">
            {index > 0 ? <span aria-hidden className="h-px w-4 bg-black/10 sm:w-10" /> : null}
            <button
              type="button"
              onClick={step.onClick}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-2 py-2 text-xs transition sm:px-4 ${
                active
                  ? "bg-[#242a29] font-bold text-white shadow-sm"
                  : visited
                    ? "font-semibold text-[#4f504b] hover:bg-white/70"
                    : "text-[#92928b] hover:bg-white/60"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${active ? "bg-white/14" : "bg-black/5"}`}>
                {step.number}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function LearnerView({
  messages,
  input,
  connectionMode,
  isSending,
  error,
  learnerMessageCount,
  transferStarted,
  selectedSystem,
  onInput,
  onSend,
  onMoreSupport,
  onReducedSupport,
  onSelectSystem,
  onInstructor,
  onAssignment,
  onWorked,
}: {
  messages: DemoMessage[];
  input: string;
  connectionMode: ConnectionMode;
  isSending: boolean;
  error: string | null;
  learnerMessageCount: number;
  transferStarted: boolean;
  selectedSystem: string | null;
  onInput: (value: string) => void;
  onSend: (value: string) => void;
  onMoreSupport: () => void;
  onReducedSupport: () => void;
  onSelectSystem: (system: string) => void;
  onInstructor: () => void;
  onAssignment: () => void;
  onWorked: () => void;
}) {
  const ready = connectionMode === "live";
  const [systemDraft, setSystemDraft] = useState("");
  const [editingSystem, setEditingSystem] = useState(false);
  const currentStage = transferStarted
    ? "Reapplying with less support"
    : learnerMessageCount === 0
      ? "Getting oriented"
      : selectedSystem
        ? "Developing your analysis"
        : "Understanding the task and choosing a system";

  function submitSystem() {
    const clean = systemDraft.trim();
    if (!clean) return;
    onSelectSystem(clean);
    setSystemDraft("");
    setEditingSystem(false);
  }

  return (
    <div className="mx-auto grid max-w-[1260px] gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
      <aside className="self-start overflow-hidden rounded-[24px] bg-white/72 shadow-[0_20px_60px_rgba(43,44,39,0.06)] ring-1 ring-black/6 lg:sticky lg:top-6">
        <div className="p-6">
        <span className="inline-flex rounded-full bg-[#d9ecea] px-3 py-1.5 text-[11px] font-bold text-[#155f64]">You are the learner</span>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8b8b84]">Assignment companion</p>
        <h2 className="mt-2 font-serif text-[27px] leading-tight tracking-[-0.025em]">Analyse a complex social system</h2>
        <p className="mt-2 text-xs font-semibold text-[#777770]">{SYSTEMS_SOCIETY_DEMO.course} · Assignment 1</p>

        <div className="mt-5 rounded-2xl bg-[#f0eee8] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#89847a]">Current stage</p>
          <p className="mt-1 text-sm font-bold text-[#2d2e2a]">{currentStage}</p>
          <div className="mt-4 border-t border-black/7 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#89847a]">Your system</p>
            <p className={`mt-1 text-sm font-bold ${selectedSystem ? "text-[#2d2e2a]" : "text-[#777770]"}`}>{selectedSystem || "Not selected yet"}</p>
            {ready ? (
              <button type="button" onClick={() => setEditingSystem((value) => !value)} className="mt-2 text-xs font-bold text-[#155f64] underline decoration-[#155f64]/25 underline-offset-4">
                {selectedSystem ? "Change or check it" : "Add or check a system"}
              </button>
            ) : null}
            {editingSystem ? (
              <form onSubmit={(event) => { event.preventDefault(); submitSystem(); }} className="mt-3 flex gap-2">
                <input value={systemDraft} onChange={(event) => setSystemDraft(event.target.value)} placeholder="e.g. a hospital" className="min-w-0 flex-1 rounded-lg border border-black/12 bg-white px-3 py-2 text-xs outline-none focus:border-[#155f64]/45" />
                <button type="submit" disabled={!systemDraft.trim()} className="rounded-lg bg-[#155f64] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Discuss</button>
              </form>
            ) : null}
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#5d5d57]">Choose and justify a complex social system, analyse its levels and interactions, explain an emergent property, and support the reasoning with evidence.</p>
        <button type="button" onClick={onAssignment} className="mt-5 flex w-full items-center justify-between rounded-xl bg-[#155f64] px-4 py-3.5 text-left text-xs font-bold text-white shadow-[0_10px_24px_rgba(21,95,100,0.16)] transition hover:bg-[#104f53]">
          Open the full assignment <span aria-hidden>↗</span>
        </button>
        </div>

        <details className="group border-t border-black/7 px-6 py-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-[#155f64]">Skills and success criteria <span className="float-right transition group-open:rotate-45">+</span></summary>
          <div className="mt-4 space-y-4 border-t border-black/7 pt-4">
            {SYSTEMS_SOCIETY_DEMO.outcomes.map((outcome) => (
              <div key={outcome.id}>
                <p className="text-xs font-bold text-[#2d2e2a]">{outcome.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#6d6d66]">{outcome.short}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-bold text-[#2d2e2a]">{SYSTEMS_SOCIETY_DEMO.additionalSkill.label} · required</p>
              <p className="mt-1 text-xs leading-5 text-[#6d6d66]">{SYSTEMS_SOCIETY_DEMO.additionalSkill.short}</p>
            </div>
          </div>
        </details>
        <details className="group border-t border-black/7 px-6 py-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-[#155f64]">Concepts you may need <span className="float-right transition group-open:rotate-45">+</span></summary>
          <div className="mt-4 space-y-4 border-t border-black/7 pt-4">
            {SYSTEMS_SOCIETY_DEMO.vocabulary.map((item) => (
              <div key={item.term}>
                <p className="text-xs font-bold">{item.term}</p>
                <p className="mt-1 text-xs leading-5 text-[#6d6d66]">{item.definition}</p>
              </div>
            ))}
          </div>
        </details>
        <details className="group border-t border-black/7 px-6 py-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-[#155f64]">Submission requirements <span className="float-right transition group-open:rotate-45">+</span></summary>
          <ul className="mt-4 space-y-2 border-t border-black/7 pt-4">
            {SYSTEMS_SOCIETY_DEMO.assignment.constraints.map((constraint) => (
              <li key={constraint} className="flex gap-2 text-xs leading-5 text-[#6d6d66]"><span aria-hidden className="text-[#155f64]">✓</span>{constraint}</li>
            ))}
          </ul>
        </details>
      </aside>

      <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_30px_90px_rgba(40,42,36,0.10)] ring-1 ring-black/6">
        <header className="flex items-center justify-between border-b border-black/7 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#155f64] font-serif text-lg text-white">A</span>
            <div><h2 className="text-sm font-bold">AI_thena coach</h2><p className="text-xs text-[#777770]">Socratic assignment support</p></div>
          </div>
          <ModeBadge mode={connectionMode} />
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto bg-[#fbfaf7] px-4 py-7 sm:px-7">
          {connectionMode === "starting" ? (
            <div className="mx-auto mt-20 max-w-lg rounded-[22px] bg-white p-7 text-center shadow-sm ring-1 ring-black/6">
              <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#155f64]/20 border-t-[#155f64]" />
              <h3 className="mt-5 font-serif text-2xl">AI_thena is preparing your session</h3>
              <p className="mt-2 text-sm leading-6 text-[#6d6d66]">A fresh assignment context and opening question are being created for this run.</p>
            </div>
          ) : null}
          {connectionMode === "unavailable" ? (
            <div className="mx-auto mt-16 max-w-xl rounded-[22px] bg-white p-7 shadow-sm ring-1 ring-amber-900/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">Live AI unavailable</p>
              <h3 className="mt-3 font-serif text-3xl tracking-[-0.025em]">This server cannot start the real conversation.</h3>
              <p className="mt-3 text-sm leading-6 text-[#65655f]">{error || "The model connection is not configured."}</p>
              <p className="mt-3 text-xs leading-5 text-[#85857e]">No scripted reply has been substituted. The worked example remains clearly separate from the live AI_thena experience.</p>
              <button type="button" onClick={onWorked} className="mt-6 rounded-full bg-[#155f64] px-5 py-3 text-xs font-bold text-white">View the pre-recorded example →</button>
            </div>
          ) : null}
          {messages.map((message) => <ConversationMessage key={message.id} message={message} />)}
          {learnerMessageCount === 0 && ready ? (
            <div className="ml-12 max-w-2xl pt-1">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b8b84]">Where would you like to begin?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <QuickPrompt label="Help me understand the assignment" onClick={() => onSend("I’m new to this assignment. Help me understand what I need to produce, the main steps, and the important constraints. Then check what I have understood.")} />
                <QuickPrompt label="Explain the key concepts and skills" onClick={() => onSend("I’m not yet confident about the concepts and skills this assignment requires. Help me identify what I need to understand, then start with the most foundational distinction.")} />
                <QuickPrompt label="Help me choose or check a system" onClick={() => onSend("I need help choosing—or checking—a suitable complex social system. Ask about my interests and help me test my own candidates without choosing for me.")} />
                <QuickPrompt label="I have an idea or draft to discuss" onClick={() => onSend("I already have an idea or some work in progress. Ask me to share it, then help me evaluate it against the relevant assignment criteria.")} />
              </div>
              <button type="button" onClick={() => onSelectSystem(SYSTEMS_SOCIETY_DEMO.sampleSystem)} className="mt-3 text-xs font-semibold text-[#155f64] underline decoration-[#155f64]/25 underline-offset-4">Or use the New York City subway as a guided sample</button>
            </div>
          ) : null}
          {isSending ? <div className="ml-12 flex items-center gap-2 text-xs text-[#777770]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#155f64]" />AI_thena is considering your reasoning…</div> : null}
        </div>

        <div className="border-t border-black/7 bg-white p-4 sm:p-6">
          {error && connectionMode !== "unavailable" ? <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">{error}</p> : null}
          <form onSubmit={(event) => { event.preventDefault(); void onSend(input); }} className="rounded-2xl border border-black/12 bg-[#fbfaf7] p-2 transition focus-within:border-[#155f64]/45 focus-within:ring-4 focus-within:ring-[#155f64]/8">
            <textarea
              value={input}
              onChange={(event) => onInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void onSend(input);
                }
              }}
              rows={3}
              disabled={!ready || isSending}
              placeholder={connectionMode === "worked" ? "This is a pre-recorded example. Start a live run to interact." : ready ? "Explain what you think. AI_thena will respond to your reasoning…" : connectionMode === "unavailable" ? "Live AI is unavailable" : "Preparing the conversation…"}
              className="w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-6 outline-none placeholder:text-[#9a9a93] disabled:opacity-50"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/6 px-2 pt-2">
              <p className="text-[11px] text-[#85857e]">Enter to send · Shift + Enter for a new line</p>
              <button type="submit" disabled={!input.trim() || !ready || isSending} className="rounded-full bg-[#155f64] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#104f53] disabled:cursor-not-allowed disabled:opacity-35">Send</button>
            </div>
          </form>
          {learnerMessageCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {connectionMode === "live" ? <button type="button" onClick={onMoreSupport} disabled={isSending} className="text-xs font-semibold text-[#155f64] hover:underline disabled:opacity-40">I need a little more support</button> : <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#85857e]">Pre-recorded conversation</span>}
              <div className="flex gap-2">
                {connectionMode === "live" && !transferStarted && learnerMessageCount >= 2 ? <button type="button" onClick={onReducedSupport} disabled={isSending} className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold hover:bg-[#f5f3ee] disabled:opacity-40">Try with less support</button> : null}
                <button type="button" onClick={onInstructor} className="rounded-full bg-[#252a29] px-4 py-2 text-xs font-bold text-white">See what the instructor receives →</button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ModeBadge({ mode }: { mode: ConnectionMode }) {
  const labels: Record<ConnectionMode, string> = {
    starting: "Connecting…",
    live: "Live AI",
    unavailable: "Live AI unavailable",
    worked: "Pre-recorded example",
  };
  return (
    <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${mode === "live" ? "bg-emerald-50 text-emerald-700" : "bg-[#f0eee8] text-[#6c6c65]"}`}>
      {labels[mode]}
    </span>
  );
}

function ConversationMessage({ message }: { message: DemoMessage }) {
  const user = message.role === "user";
  return (
    <div className={`flex gap-3 ${user ? "justify-end" : "justify-start"}`}>
      {!user ? <span className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#d9ecea] text-xs font-bold text-[#155f64]">A</span> : null}
      <div className={`max-w-[82%] rounded-2xl px-5 py-4 text-[15px] leading-7 ${user ? "rounded-br-sm bg-[#242a29] text-white" : "rounded-bl-sm bg-white text-[#343530] shadow-sm ring-1 ring-black/6"}`}>
        {message.content ? (
          <ReactMarkdown components={{ p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>, strong: ({ children }) => <strong className="font-bold">{children}</strong> }}>
            {message.content}
          </ReactMarkdown>
        ) : <span className="inline-block h-4 w-10 animate-pulse rounded-full bg-black/10" />}
      </div>
      {user ? <span className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#e9e2d5] text-xs font-bold text-[#6d5734]">You</span> : null}
    </div>
  );
}

function QuickPrompt({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-12 rounded-xl border border-[#155f64]/18 bg-white px-4 py-3 text-left text-xs font-semibold leading-5 text-[#155f64] shadow-sm transition hover:-translate-y-0.5 hover:border-[#155f64]/35 hover:bg-[#f7fbfa]">{label}</button>;
}

function InstructorView({
  messages,
  firstProfile,
  currentProfile,
  transferProfile,
  connectionMode,
  supportLevel,
  evidenceSnapshot,
  evidenceLoading,
  evidenceError,
  onWorked,
  onLearner,
  onReviewer,
  onAssignment,
}: {
  messages: DemoMessage[];
  firstProfile: ReasoningProfile;
  currentProfile: ReasoningProfile;
  transferProfile: ReasoningProfile | null;
  connectionMode: ConnectionMode;
  supportLevel: number;
  evidenceSnapshot: EvidenceSnapshot | null;
  evidenceLoading: boolean;
  evidenceError: string | null;
  onWorked: () => void;
  onLearner: () => void;
  onReviewer: () => void;
  onAssignment: () => void;
}) {
  const userMessages = messages.filter((message) => message.role === "user");
  const band = userMessages.length ? getEvidenceBand(currentProfile) : null;
  const growth = currentProfile.observedCount - firstProfile.observedCount;
  const transferEvidence = Boolean(transferProfile && transferProfile.observedCount >= 5);
  const missing = PROFILE_ITEMS.filter((item) => !currentProfile[item.key]);

  if (connectionMode === "live" && userMessages.length > 0) {
    if (evidenceLoading || (!evidenceSnapshot && !evidenceError)) {
      return <InstructorLoading />;
    }
    if (evidenceError || !evidenceSnapshot) {
      return (
        <section className="mx-auto max-w-3xl rounded-[28px] bg-white p-10 text-center shadow-[0_30px_90px_rgba(40,42,36,0.10)] ring-1 ring-black/6">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-lg text-amber-700">!</span>
          <h2 className="mt-5 font-serif text-4xl tracking-[-0.03em]">The instructor evidence could not be prepared.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#696961]">{evidenceError || "The evidence service did not return a result."}</p>
          <button type="button" onClick={onLearner} className="mt-7 rounded-full bg-[#155f64] px-5 py-3 text-sm font-bold text-white">Return to the learner conversation</button>
        </section>
      );
    }
    return (
      <LiveInstructorView
        snapshot={evidenceSnapshot}
        onLearner={onLearner}
        onReviewer={onReviewer}
        onAssignment={onAssignment}
      />
    );
  }

  if (!userMessages.length) {
    return (
      <section className="mx-auto max-w-3xl rounded-[28px] bg-white p-10 text-center shadow-[0_30px_90px_rgba(40,42,36,0.10)] ring-1 ring-black/6">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#efece4] text-lg">◎</span>
        <h2 className="mt-5 font-serif text-4xl tracking-[-0.03em]">There is no learner evidence yet.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#696961]">The instructor view should not manufacture an assessment before the learner has had an opportunity to think.</p>
        <div className="mt-7 flex justify-center gap-3"><button type="button" onClick={onLearner} className="rounded-full bg-[#155f64] px-5 py-3 text-sm font-bold text-white">Return to the learner experience</button><button type="button" onClick={onWorked} className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold">Load a worked example</button></div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1160px] space-y-7">
      <section className="rounded-[28px] bg-[#242a29] p-7 text-white shadow-[0_30px_80px_rgba(39,42,37,0.16)] sm:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#a9d9d5]">Pre-recorded example · instructor view</span>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.25rem,4vw,4rem)] leading-[1.02] tracking-[-0.035em]">What does the conversation reveal about the learner’s thinking?</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62">This illustrative readout uses the example transcript—not live AI_thena evidence. It is formative evidence for instructor review, not an automated grade or a claim of durable mastery.</p>
            <button type="button" onClick={onAssignment} className="mt-5 text-xs font-bold text-[#a9d9d5] underline decoration-white/20 underline-offset-4 hover:text-white">Review the relevant assignment instructions</button>
          </div>
          <div className="flex-none rounded-2xl bg-white/8 p-5 text-right ring-1 ring-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Provisional rubric match</p>
            <p className="mt-2 font-serif text-5xl">{band}<span className="text-xl text-white/40">/5</span></p>
            <p className="mt-1 text-xs text-white/56">#SystemAnalysis</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <EvidenceSummary label="Observed" tone="teal" text={`${currentProfile.observedCount} of 8 target reasoning elements are visible across ${userMessages.length} learner contribution${userMessages.length === 1 ? "" : "s"}.`} />
        <EvidenceSummary label="Reasonable interpretation" tone="gold" text={growth > 0 ? `The learner’s later contributions contain ${growth} more target element${growth === 1 ? "" : "s"} than the first attempt, after receiving support.` : "The conversation identifies where the decomposition remains incomplete; improvement is not yet visible."} />
        <EvidenceSummary label="Not established" tone="grey" text={transferEvidence ? "One reduced-support response is promising, but it does not establish durable or general transfer." : "Independent application, durable transfer, and AI-caused improvement have not been established."} />
      </section>

      <section className="rounded-[26px] bg-white p-6 shadow-[0_22px_65px_rgba(40,42,36,0.07)] ring-1 ring-black/6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-black/7 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#155f64]">Evidence map</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.025em]">What appeared in the learner’s reasoning</h2></div>
          <p className="max-w-sm text-xs leading-5 text-[#777770]">Presence is not the same as quality. These indicators help an instructor locate evidence; the rubric judgment remains reviewable.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROFILE_ITEMS.map((item) => {
            const present = Boolean(currentProfile[item.key]);
            return (
              <div key={item.key} className={`rounded-2xl p-4 ring-1 ${present ? "bg-[#edf6f4] ring-[#155f64]/15" : "bg-[#f4f2ed] ring-black/5"}`}>
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">{item.label}</p><span aria-label={present ? "Observed" : "Not yet observed"} className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${present ? "bg-[#155f64] text-white" : "bg-black/7 text-[#777770]"}`}>{present ? "✓" : "—"}</span></div>
                <p className="mt-2 text-xs leading-5 text-[#6d6d66]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <RecommendationCard
          kicker="Next move for the learner"
          title={missing.length ? `Strengthen: ${missing[0].label.toLowerCase()}` : "Test the reasoning with a changed question"}
          text={missing.length ? LEARNER_NEXT_STEPS[missing[0].key] ?? missing[0].description : SYSTEMS_SOCIETY_DEMO.reducedSupportPrompt}
          action="Return to the learner view"
          onAction={onLearner}
        />
        <RecommendationCard
          kicker="Next move for the instructor"
          title={transferEvidence ? "Repeat later with less support" : "Create an independent opportunity"}
          text={transferEvidence ? "Use another system or explanatory question after a delay. Compare the reasoning process, not only the final prose." : "Ask the learner to adapt the decomposition to a different subway question without reusing the scaffold. Review what persists and what disappears."}
          action="Evaluate the demo as a colleague"
          onAction={onReviewer}
        />
      </section>

      <details className="rounded-[22px] bg-white/70 p-6 ring-1 ring-black/6">
        <summary className="cursor-pointer text-sm font-bold">Inspect the conversation used as evidence</summary>
        <div className="mt-5 space-y-4 border-t border-black/7 pt-5">
          {messages.filter((message) => message.content).map((message) => (
            <blockquote key={message.id} className={`border-l-2 pl-4 text-sm leading-6 ${message.role === "user" ? "border-[#155f64]" : "border-[#c59a55] text-[#686861]"}`}>
              <strong className="mr-2 text-xs uppercase tracking-[0.08em]">{message.role === "user" ? "Learner" : "AI_thena"}</strong>{message.content.replace(/\*\*/g, "")}
            </blockquote>
          ))}
          <p className="pt-2 text-[11px] text-[#85857e]">Experience mode: {connectionMode}. Support rung reached: {supportLevel}/4.</p>
        </div>
      </details>
    </div>
  );
}

function InstructorLoading() {
  return (
    <section className="mx-auto max-w-3xl rounded-[28px] bg-white p-10 text-center shadow-[0_30px_90px_rgba(40,42,36,0.10)] ring-1 ring-black/6">
      <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-[#155f64]/20 border-t-[#155f64]" />
      <h2 className="mt-6 font-serif text-4xl tracking-[-0.03em]">AI_thena is assembling the evidence.</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#696961]">It is closing this learner run, generating the learner summary, and translating the persisted conversation into a formative instructor brief.</p>
    </section>
  );
}

function humanizeStatus(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function LiveInstructorView({
  snapshot,
  onLearner,
  onReviewer,
  onAssignment,
}: {
  snapshot: EvidenceSnapshot;
  onLearner: () => void;
  onReviewer: () => void;
  onAssignment: () => void;
}) {
  const learnerContributions = snapshot.messages.filter(
    (message) => message.role === "user"
  );
  const addressed = snapshot.checkpoints.filter(
    (checkpoint) => checkpoint.status !== "unseen"
  );
  const sufficient = snapshot.checkpoints.filter(
    (checkpoint) => checkpoint.status === "evidence_sufficient"
  );
  const outcomeKey = (value: string) =>
    value.split(/[—–-]/)[0].replace(/[^a-z]/gi, "").toLowerCase();
  const assessmentByOutcome = new Map<string, EvidenceSnapshot["loAssessments"][number]>();
  for (const assessment of snapshot.loAssessments) {
    const key = outcomeKey(assessment.learningOutcome);
    if (!assessmentByOutcome.has(key)) assessmentByOutcome.set(key, assessment);
  }
  const assessedOutcomes = SYSTEMS_SOCIETY_DEMO.outcomes.map((outcome) => {
    const key = outcomeKey(outcome.label);
    return { outcome, assessment: assessmentByOutcome.get(key) ?? null };
  });
  const latestAssessment = assessedOutcomes.find((item) => item.assessment)?.assessment ?? null;
  const evidenceItems = snapshot.teachingBrief?.evidenceMap?.items ?? [];
  const teachingMoves = snapshot.teachingBrief?.suggestedTeachingMoves ?? [];
  const firstOpenCheckpoint = snapshot.checkpoints.find(
    (checkpoint) => checkpoint.status !== "evidence_sufficient"
  );

  return (
    <div className="mx-auto max-w-[1160px] space-y-7">
      <section className="rounded-[28px] bg-[#242a29] p-7 text-white shadow-[0_30px_80px_rgba(39,42,37,0.16)] sm:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#a9d9d5]">Live AI_thena evidence · instructor view</span>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.25rem,4vw,4rem)] leading-[1.02] tracking-[-0.035em]">What does this conversation actually reveal?</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62">This readout comes from the session AI_thena just persisted and analyzed. It is formative evidence for review—not an automated grade or a claim of durable mastery.</p>
            <button type="button" onClick={onAssignment} className="mt-5 text-xs font-bold text-[#a9d9d5] underline decoration-white/20 underline-offset-4 hover:text-white">Compare with the assignment and 0–5 rubric</button>
          </div>
          <div className="flex-none rounded-2xl bg-white/8 p-5 text-right ring-1 ring-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">AI_thena outcome status</p>
            <p className="mt-2 font-serif text-3xl">{latestAssessment ? humanizeStatus(latestAssessment.status) : "Not yet assessed"}</p>
            <p className="mt-1 text-xs text-white/56">{latestAssessment ? `${latestAssessment.confidence} confidence` : "Instructor judgment needed"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <EvidenceSummary
          label="Observed"
          tone="teal"
          text={`${learnerContributions.length} learner contribution${learnerContributions.length === 1 ? "" : "s"} persisted; ${addressed.length} of ${snapshot.checkpoints.length} reasoning checkpoints were addressed, and ${sufficient.length} were marked evidence sufficient.`}
        />
        <EvidenceSummary
          label="AI interpretation"
          tone="gold"
          text={latestAssessment?.evidenceSummary || evidenceItems[0]?.classificationLabel || "AI_thena found too little evidence to make a useful outcome-level interpretation."}
        />
        <EvidenceSummary
          label="Not established"
          tone="grey"
          text="This run cannot establish independent performance, durable transfer, or that AI caused any improvement. Those require later, reduced-support evidence and instructor judgment."
        />
      </section>

      <section className="rounded-[24px] bg-white/72 p-6 ring-1 ring-black/6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.11em] text-[#155f64]">Learning-outcome coverage</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.025em]">Assess only what the conversation evidenced</h2></div>
          <p className="max-w-sm text-xs leading-5 text-[#777770]">An outcome remains unassessed when the learner has not yet produced relevant evidence.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {assessedOutcomes.map(({ outcome, assessment }) => (
            <article key={outcome.id} className={`rounded-2xl p-4 ring-1 ${assessment ? "bg-[#edf6f4] ring-[#155f64]/15" : "bg-[#f3f1eb] ring-black/5"}`}>
              <p className="text-xs font-bold text-[#155f64]">{outcome.label}</p>
              <p className="mt-2 text-sm font-bold text-[#343530]">{assessment ? humanizeStatus(assessment.status) : "Not assessed"}</p>
              <p className="mt-2 text-xs leading-5 text-[#6d6d66]">{assessment?.evidenceSummary || "No relevant learner evidence was produced in this run."}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-6 shadow-[0_22px_65px_rgba(40,42,36,0.07)] ring-1 ring-black/6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-black/7 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#155f64]">Persisted checkpoint evidence</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.025em]">Where the learner’s reasoning was tested</h2></div>
          <p className="max-w-sm text-xs leading-5 text-[#777770]">These statuses are generated by AI_thena during the conversation. They locate evidence; they do not replace review against the assignment rubric.</p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {snapshot.checkpoints.map((checkpoint, index) => {
            const complete = checkpoint.status === "evidence_sufficient";
            const active = checkpoint.status !== "unseen";
            return (
              <article key={checkpoint.id} className={`rounded-2xl p-5 ring-1 ${complete ? "bg-[#edf6f4] ring-[#155f64]/15" : active ? "bg-amber-50/70 ring-amber-800/10" : "bg-[#f4f2ed] ring-black/5"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#85857e]">Checkpoint {index + 1} · {checkpoint.processLevel}</p><h3 className="mt-2 text-sm font-bold leading-5">{checkpoint.prompt}</h3></div>
                  <span className={`flex-none rounded-full px-2.5 py-1 text-[10px] font-bold ${complete ? "bg-[#155f64] text-white" : active ? "bg-amber-100 text-amber-800" : "bg-black/6 text-[#777770]"}`}>{humanizeStatus(checkpoint.status)}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#6d6d66]">{checkpoint.evidenceNotes || (active ? `${checkpoint.turnsSpent} turn${checkpoint.turnsSpent === 1 ? "" : "s"} spent here; no separate evidence note was stored.` : "No evidence opportunity was reached in this conversation.")}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[24px] bg-white p-7 ring-1 ring-black/6">
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#155f64]">Learner-facing summary</p>
          <h3 className="mt-3 font-serif text-2xl tracking-[-0.02em]">What AI_thena would return to the learner</h3>
          <div className="mt-4 text-sm leading-6 text-[#606059]">
            {snapshot.learner.summary ? <ReactMarkdown>{snapshot.learner.summary}</ReactMarkdown> : <p>No learner summary was generated.</p>}
          </div>
        </article>
        <RecommendationCard
          kicker="Recommended next evidence opportunity"
          title={teachingMoves[0]?.whatToAddress || (firstOpenCheckpoint ? "Revisit the next unconfirmed reasoning step" : "Test a changed question with less support")}
          text={teachingMoves[0]?.whyItMatters || firstOpenCheckpoint?.prompt || "Ask the learner to adapt the decomposition to a different subway question without reusing the earlier scaffold."}
          action="Return to the learner conversation"
          onAction={onLearner}
        />
      </section>

      <section className="rounded-[24px] bg-white/72 p-6 ring-1 ring-black/6 sm:p-8">
        <div className="flex items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7c633a]">Consequential evidence signals</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.025em]">Claims AI_thena was willing to record</h2></div>
          <span className="rounded-full bg-[#efece4] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#696961]">{snapshot.evidenceSignals.length} signal{snapshot.evidenceSignals.length === 1 ? "" : "s"}</span>
        </div>
        {snapshot.evidenceSignals.length ? (
          <div className="mt-6 space-y-3">
            {snapshot.evidenceSignals.map((signal) => (
              <article key={signal.id} className="rounded-2xl bg-white p-5 ring-1 ring-black/6">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.09em] text-[#777770]"><span>{humanizeStatus(signal.signalType)}</span><span>·</span><span>{signal.confidenceLevel} confidence</span><span>·</span><span>{signal.status}</span></div>
                <p className="mt-3 text-sm font-semibold leading-6">{signal.claim}</p>
                {signal.citations[0] ? <blockquote className="mt-3 border-l-2 border-[#155f64] pl-4 text-xs leading-5 text-[#65655f]">“{signal.citations[0].quotedText}”</blockquote> : null}
                <p className="mt-3 text-xs leading-5 text-[#777770]">Missing or limiting evidence: {signal.missingEvidence || signal.limitations}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-[#f3f1eb] p-5 text-sm leading-6 text-[#66665f]">No consequential evidence signal was recorded. AI_thena only promotes a claim when it can meet the evidence policy; ordinary conversation metadata remains visible above.</p>
        )}
        {snapshot.reportError ? <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">{snapshot.reportError}</p> : null}
      </section>

      <details className="rounded-[22px] bg-white/70 p-6 ring-1 ring-black/6">
        <summary className="cursor-pointer text-sm font-bold">Inspect the persisted conversation and metadata</summary>
        <div className="mt-5 space-y-4 border-t border-black/7 pt-5">
          {snapshot.messages.map((message) => (
            <blockquote key={message.id} className={`border-l-2 pl-4 text-sm leading-6 ${message.role === "user" ? "border-[#155f64]" : "border-[#c59a55] text-[#686861]"}`}>
              <strong className="mr-2 text-xs uppercase tracking-[0.08em]">{message.role === "user" ? "Learner" : "AI_thena"}</strong>{message.content}
              <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-[#999991]">{[message.topicThread, message.mode, message.questionType, message.feedbackType, message.engagementFlag].filter(Boolean).join(" · ") || "No diagnostic tags stored"}</p>
            </blockquote>
          ))}
        </div>
      </details>

      <section className="rounded-[22px] border border-dashed border-black/15 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#777770]">Evidence boundary</p>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-[#696961] sm:grid-cols-2">
          {snapshot.limitations.map((limitation) => <li key={limitation}>— {limitation}</li>)}
        </ul>
        <button type="button" onClick={onReviewer} className="mt-6 text-xs font-bold text-[#155f64] hover:underline">Evaluate the demo as a colleague →</button>
      </section>
    </div>
  );
}

function EvidenceSummary({ label, text, tone }: { label: string; text: string; tone: "teal" | "gold" | "grey" }) {
  const accent = tone === "teal" ? "bg-[#155f64]" : tone === "gold" ? "bg-[#c2944b]" : "bg-[#8b8b84]";
  return <article className="rounded-[22px] bg-white/72 p-6 ring-1 ring-black/6"><span className={`mb-5 block h-1 w-10 rounded-full ${accent}`} /><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#777770]">{label}</p><p className="mt-3 text-sm leading-6 text-[#3f403b]">{text}</p></article>;
}

function RecommendationCard({ kicker, title, text, action, onAction }: { kicker: string; title: string; text: string; action: string; onAction: () => void }) {
  return <article className="rounded-[24px] bg-[#ece8de] p-7"><p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7c633a]">{kicker}</p><h3 className="mt-3 font-serif text-2xl tracking-[-0.02em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#606059]">{text}</p><button type="button" onClick={onAction} className="mt-6 text-xs font-bold text-[#155f64] hover:underline">{action} →</button></article>;
}

function ReviewerView({ onInstructor }: { onInstructor: () => void }) {
  const [ratings, setRatings] = useState<Record<string, number | null>>(
    Object.fromEntries(SYSTEMS_SOCIETY_DEMO.reviewerCriteria.map((item) => [item.id, null]))
  );
  const [credible, setCredible] = useState("");
  const [challenge, setChallenge] = useState("");
  const [change, setChange] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyFeedback() {
    const text = formatReviewerFeedback({ ratings, credible, challenge, change });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="text-center">
        <span className="inline-flex rounded-full bg-[#e7dfd0] px-3 py-1.5 text-[11px] font-bold text-[#745b33]">You are back in your colleague role</span>
        <h1 className="mx-auto mt-5 max-w-3xl font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02] tracking-[-0.04em]">Is this a credible way to support learning and inform teaching?</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#696961]">Rate what this experience actually demonstrated. A score of 5 should mean the dimension is convincingly realised—not simply that the idea is promising.</p>
      </section>

      <section className="mt-8 rounded-[24px] bg-[#242a29] p-6 text-white sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9ed2cf]">Optional stress tests</p><h2 className="mt-2 font-serif text-2xl tracking-[-0.02em]">Probe the product—not the learner</h2></div>
          <ul className="grid gap-2 text-xs leading-5 text-white/68 sm:grid-cols-2">
            <li>Ask it to explain the complete instructions or a rubric distinction.</li>
            <li>Propose a system that may be complicated but not genuinely social.</li>
            <li>Ask it to write a submission-ready section and inspect the redirection.</li>
            <li>Paste a weak learner-authored idea and see whether the critique preserves ownership.</li>
          </ul>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        {SYSTEMS_SOCIETY_DEMO.reviewerCriteria.map((criterion) => (
          <article key={criterion.id} className="grid gap-5 rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
            <div><h2 className="text-sm font-bold">{criterion.label}</h2><p className="mt-1 text-xs leading-5 text-[#777770]">{criterion.question}</p></div>
            <div className="flex gap-1" aria-label={`Rate ${criterion.label} from zero to five`}>
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRatings((current) => ({ ...current, [criterion.id]: value }))} className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${ratings[criterion.id] === value ? "bg-[#155f64] text-white" : "bg-[#f2f0eb] text-[#66665f] hover:bg-[#dcebea]"}`}>{value}</button>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <ReflectionField label="What felt credible?" value={credible} onChange={setCredible} />
        <ReflectionField label="What would you challenge?" value={challenge} onChange={setChallenge} />
        <ReflectionField label="What should change next?" value={change} onChange={setChange} />
      </section>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onInstructor} className="rounded-full border border-black/10 bg-white/65 px-5 py-3 text-sm font-semibold">Return to instructor evidence</button>
        <button type="button" onClick={copyFeedback} className="rounded-full bg-[#155f64] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_35px_rgba(21,95,100,0.2)]">{copied ? "Feedback copied" : "Copy my feedback"}</button>
      </div>
    </div>
  );
}

function ReflectionField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="rounded-[22px] bg-white p-5 ring-1 ring-black/6"><span className="text-xs font-bold">{label}</span><textarea rows={5} value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full resize-none rounded-xl bg-[#f5f3ee] p-3 text-sm leading-6 outline-none ring-1 ring-black/5 focus:ring-[#155f64]/35" placeholder="Add a brief observation…" /></label>;
}
