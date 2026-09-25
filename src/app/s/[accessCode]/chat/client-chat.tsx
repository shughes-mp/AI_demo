"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ChatArea } from "@/components/chat/chat-area";
import { ChatInput } from "@/components/chat/chat-input";
import { LearnerReflectionForm } from "@/components/chat/learner-reflection-form";

function getConversationPhase(exchangeCount: number, maxExchanges: number) {
  const safeMax = Math.max(maxExchanges, 1);
  const percentage = Math.min((exchangeCount / safeMax) * 100, 100);

  if (percentage < 40) {
    return { phase: "Getting started", percentage };
  }
  if (percentage < 70) {
    return { phase: "Exploring the reading", percentage };
  }
  if (percentage < 90) {
    return { phase: "Wrapping up", percentage };
  }
  return { phase: "Synthesis", percentage };
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  hidden?: boolean;
}

interface ClientChatProps {
  accessCode: string;
  sessionName: string;
  sessionDescription: string | null;
  courseContext: string | null;
  learningGoal: string | null;
  planningOpeningQuestion: string | null;
  planningTaskInstructions: string | null;
  planningIntendedOutput: string | null;
  maxExchanges: number;
}

export function ClientChat({
  accessCode,
  sessionName,
  sessionDescription,
  courseContext,
  learningGoal,
  planningOpeningQuestion,
  planningTaskInstructions,
  planningIntendedOutput,
  maxExchanges,
}: ClientChatProps) {
  const router = useRouter();
  const [studentSessionId, setStudentSessionId] = useState<string | null>(null);
  const [capabilityToken, setCapabilityToken] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [orientationOpen, setOrientationOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const initialized = useRef(false);

  const exchangeCount = Math.ceil(
    messages.filter((message: any) => message.role === "user" && !message.hidden).length
  );
  const phaseInfo = getConversationPhase(exchangeCount, maxExchanges);

  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = summary;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const triggerEndSession = async (sid: string) => {
    if (isEnded || isEnding) return;
    setIsEnding(true);
    try {
      const res = await fetch("/api/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentSessionId: sid, capabilityToken }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      }
      if (data.reflection?.submittedAt) {
        setReflectionSaved(true);
      }
    } catch (err) {
      console.error("Failed to end session:", err);
    } finally {
      setIsEnded(true);
      setIsEnding(false);
    }
  };

  const handleDone = () => {
    sessionStorage.removeItem("studentSessionId");
    sessionStorage.removeItem("studentCapabilityToken");
    sessionStorage.removeItem("studentName");
    router.push(`/s/${accessCode}`);
  };

  const sendMessage = async (
    contentToSend: string,
    sid: string | null = studentSessionId,
    hidden = false,
    token: string | null = capabilityToken
  ) => {
    if (!sid || !contentToSend.trim() || isLoading) return;

    setIsLoading(true);
    setError(false);

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: contentToSend,
      hidden,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentSessionId: sid,
          capabilityToken: token,
          messages: newMessages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === "EXCHANGE_LIMIT") {
          triggerEndSession(sid);
        } else {
          setError(true);
        }
        setIsLoading(false);
        return;
      }

      if (!res.body) throw new Error("No body in response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      const assistantMessageId = Math.random().toString();
      setMessages((prev: any) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setMessages((prev: any) => {
            const mapped = [...prev];
            const lastIdx = mapped.length - 1;
            if (mapped[lastIdx].id === assistantMessageId) {
              mapped[lastIdx] = {
                ...mapped[lastIdx],
                content: mapped[lastIdx].content + chunk,
              };
            }
            return mapped;
          });
        }
      }
    } catch (err) {
      console.error("Stream Error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sid = sessionStorage.getItem("studentSessionId");
    const token = sessionStorage.getItem("studentCapabilityToken");
    const sname = sessionStorage.getItem("studentName");

    if (!sid || !token) {
      router.push(`/s/${accessCode}`);
      return;
    }

    setStudentSessionId(sid);
    setCapabilityToken(token);
    setStudentName(sname);

    if (!initialized.current) {
      initialized.current = true;
      void sendMessage(
        `Hi. My name is ${sname || "a learner"}. I'm ready to begin the session.
OPENING SEQUENCE INSTRUCTION: This is the opening exchange.
1. Greet me by name.
2. Ask ONE question about what I already know or believe about the main topic before doing the reading.${planningOpeningQuestion ? ` Use this exact question: ${planningOpeningQuestion}` : ""}
3. Do NOT ask about the reading content yet.
4. Wait for my response before bridging to the reading and asking the first Socratic question.
If course context is available, use it naturally in the first three exchanges.`,
        sid,
        true,
        token
      );
    }
    // This one-time hydration deliberately reads browser session state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && studentSessionId && exchangeCount < maxExchanges) {
      const content = input;
      setInput("");
      sendMessage(content);
    }
  };

  const handleEndClick = () => {
    if (!isEnding) {
      setConfirmingEnd(true);
    }
  };

  const handleConfirmEnd = () => {
    setConfirmingEnd(false);
    if (studentSessionId) {
      triggerEndSession(studentSessionId);
    }
  };

  const handleCancelEnd = () => {
    setConfirmingEnd(false);
  };

  if (!studentSessionId) return null;

  if (isEnded && summary) {
    return (
      <main className="minerva-page">
        <div className="minerva-shell">
          <section className="section-rule grid grid-cols-1 md:grid-cols-[156px_minmax(0,1fr)]">
            <div className="hidden border-r border-[var(--rule)] md:block" />
            <div className="px-4 py-14 md:px-8 md:py-18">
              <p className="eyebrow eyebrow-teal">{sessionName}</p>
              <h1 className="section-title mt-5 max-w-[14ch]">
                Your session summary{studentName ? `, ${studentName}` : ""}
              </h1>
              <p className="body-copy muted-copy mt-4 max-w-[36rem]">
                Save or share this with your instructor for formative review.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  onClick={handleCopySummary}
                  className="minerva-button"
                >
                  {copied ? "Copied!" : "Copy summary"}
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="minerva-button minerva-button-secondary"
                >
                  Done
                </button>
              </div>

              <div className="minerva-card mt-10 max-w-3xl p-6 md:p-8">
                <div className="prose prose-sm max-w-none text-[var(--charcoal)] [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-[18px] [&_h2]:leading-snug [&_h2]:tracking-[-0.01em] [&_h2:first-child]:mt-0 [&_ul]:mt-1 [&_ul]:space-y-1 [&_li]:leading-7 [&_li]:text-[15px]">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>

              <p className="mt-6 max-w-[36rem] text-[12px] text-[var(--dim-grey)]">
                This summary was generated by AI and may not capture everything
                discussed. It is formative support, not a grade or complete record.
              </p>

              {!reflectionSaved && capabilityToken ? (
                <LearnerReflectionForm
                  studentSessionId={studentSessionId}
                  capabilityToken={capabilityToken}
                  onSaved={() => setReflectionSaved(true)}
                />
              ) : reflectionSaved ? (
                <div className="mt-8 max-w-3xl border border-[rgba(96,140,34,0.28)] bg-[rgba(96,140,34,0.08)] p-5 text-sm text-[#4e6e1e]" role="status">
                  Your reflection has been saved and will accompany the AI summary during formative review.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (isEnded && !summary) {
    return (
      <main className="minerva-page">
        <div className="minerva-shell">
          <section className="section-rule grid grid-cols-1 md:grid-cols-[156px_minmax(0,1fr)]">
            <div className="hidden border-r border-[var(--rule)] md:block" />
            <div className="px-4 py-14 md:px-8 md:py-18">
              <p className="eyebrow eyebrow-teal">{sessionName}</p>
              <h1 className="section-title mt-5 max-w-[14ch]">
                {isEnding ? "Wrapping up your session..." : "Session ended"}
              </h1>
              {!isEnding && (
                <p className="body-copy muted-copy mt-4">
                  We couldn&apos;t generate a summary this time. You can close
                  this window.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="minerva-page flex min-h-screen flex-col">
      <div className="minerva-shell flex min-h-screen flex-col">
        <header className="top-rule bottom-rule grid grid-cols-1 md:grid-cols-[156px_1fr_220px]">
          <div className="hidden border-r border-[var(--rule)] md:block" />
          <div className="px-4 py-5 md:px-8">
            <h1 className="mt-2 font-serif text-[34px] leading-[0.96] tracking-[-0.03em]">
              {sessionName}
            </h1>
          </div>
          <div className="px-4 py-5 md:px-8 md:text-right" />
        </header>

        <div className="grid flex-1 grid-cols-1 md:grid-cols-[156px_minmax(0,1fr)]">
          <aside className="hidden border-r border-[var(--rule)] md:block" />
          <div className="flex min-h-0 flex-col">
            <div className="border-b border-[var(--rule)]">
              <button
                type="button"
                onClick={() => setOrientationOpen((v: any) => !v)}
                aria-expanded={orientationOpen}
                aria-controls="learner-session-orientation"
                className="flex w-full items-center justify-between px-4 py-3 text-left md:px-8 hover:bg-[rgba(0,0,0,0.02)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">
                    About this session
                  </span>
                  {studentName && (
                    <span className="text-[12px] text-[var(--dim-grey)]">
                      · {studentName}
                    </span>
                  )}
                </div>
                <svg
                  aria-hidden="true"
                  className={`w-4 h-4 text-[var(--dim-grey)] transition-transform ${orientationOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {orientationOpen && (
                <div id="learner-session-orientation" className="px-4 pb-6 pt-2 md:px-8">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_300px]">
                    <div>
                      {sessionDescription && (
                        <p className="body-copy max-w-[40rem]">
                          {sessionDescription}
                        </p>
                      )}
                      <p className="mt-3 max-w-[40rem] text-[14px] leading-7 text-[var(--dim-grey)]">
                        Start by sharing what you already know about the topic.
                        AI_demo will ask questions, look for evidence in your
                        reasoning, and stay grounded in the materials your
                        instructor provided. Try to explain your thinking
                        before asking for help. This is formative learning
                        support, not an automated grade, and you can correct
                        the AI-generated summary at the end.
                      </p>
                      {planningTaskInstructions ? (
                        <div className="mt-4 border-l-2 border-[var(--teal)] pl-4 text-[14px] leading-6 text-[var(--charcoal)]">
                          <p><strong>Your task:</strong> {planningTaskInstructions}</p>
                          {planningIntendedOutput ? <p className="mt-2"><strong>Finish with:</strong> {planningIntendedOutput}</p> : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="minerva-panel p-5">
                      <div className="space-y-4 text-[13px] leading-6">
                        {courseContext && (
                          <div>
                            <p className="eyebrow eyebrow-olive">Why This Matters</p>
                            <p className="mt-2 text-[var(--charcoal)]">{courseContext}</p>
                          </div>
                        )}
                        {learningGoal && (
                          <div>
                            <p className="eyebrow eyebrow-rose">Goal For This Session</p>
                            <p className="mt-2 text-[var(--charcoal)]">{learningGoal}</p>
                          </div>
                        )}
                        {studentName && (
                          <p className="border-t border-[var(--rule)] pt-4 text-[var(--dim-grey)]">
                            Participating as <strong>{studentName}</strong>.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1">
              <ChatArea messages={messages.filter((m: any) => !m.hidden)} isLoading={isLoading} />
            </div>

            <div className="border-t border-[var(--rule)] px-4 py-4 pb-6 md:px-8">
              {error && (
                <div className="mb-4 border border-[rgba(223,47,38,0.24)] bg-[rgba(223,47,38,0.08)] px-4 py-3 text-[13px] text-[var(--signal)]">
                  I&apos;m having trouble connecting right now. Please try again
                  in a moment.
                </div>
              )}

              <ChatInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={
                  isEnded ||
                  isEnding ||
                  (exchangeCount >= maxExchanges && !isLoading)
                }
              />

              {maxExchanges > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--charcoal)]">
                      {phaseInfo.phase}
                    </span>
                    <span
                      className="cursor-help text-xs text-[var(--dim-grey)]"
                      title={`${exchangeCount} / ${maxExchanges} exchanges`}
                    >
                      Session progress
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[rgba(60,55,50,0.12)]">
                    <div
                      role="progressbar"
                      aria-label="Session progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(phaseInfo.percentage)}
                      className="h-full bg-[var(--teal)] transition-all duration-300"
                      style={{ width: `${phaseInfo.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {exchangeCount >= Math.floor(maxExchanges * 0.9) &&
                exchangeCount < maxExchanges &&
                !isLoading &&
                !isEnded && (
                  <div className="mt-3 rounded border border-[rgba(144,111,18,0.28)] bg-[rgba(144,111,18,0.1)] p-3 text-sm text-[#6f5710]">
                    You&apos;re approaching the end of this session. Take a moment
                    to synthesize what you&apos;ve learned before your final exchange.
                  </div>
                )}

              <div className="mt-3 flex flex-col gap-2 text-[12px] font-medium text-[var(--dim-grey)] md:flex-row md:items-center md:justify-between">
                <span>
                  Your instructor&apos;s materials come first; broader context is identified when used.
                </span>
                <span>{phaseInfo.phase}</span>
              </div>

              {!isEnded && exchangeCount < maxExchanges && (
                <div className="mt-6 border-t border-[var(--rule)] pt-4">
                  {confirmingEnd ? (
                    <div className="minerva-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--charcoal)]">
                          End this session now?
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--dim-grey)]">
                          We&apos;ll wrap up the conversation and prepare a formative session summary.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={handleConfirmEnd}
                          className="minerva-button"
                        >
                          Yes, end it
                        </button>
                        <button
                          onClick={handleCancelEnd}
                          className="minerva-button minerva-button-secondary"
                        >
                          Keep going
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={handleEndClick}
                        disabled={isEnding || isLoading}
                        className="minerva-button minerva-button-secondary"
                      >
                        {isEnding ? "Ending..." : "End session"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {exchangeCount >= maxExchanges && !isLoading && !isEnded && (
                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-[13px] font-semibold text-[var(--signal)]">
                    You have reached the message limit for this session.
                  </p>
                  <button
                    onClick={() => triggerEndSession(studentSessionId)}
                    className="minerva-button"
                  >
                    View Summary
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
