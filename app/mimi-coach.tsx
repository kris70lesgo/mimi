"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, MessageCircle, Send, Sparkles, X } from "lucide-react";

type CoachContext = {
  lesson?: string;
  activity?: string;
  objective?: string;
  concept?: string;
  weakTopics: string[];
  mastery?: number;
};

type Message = { role: "coach" | "learner"; content: string };
type CoachAction = { type: "open_atlas" | "open_practice"; label: string; concept?: string };

const prompts = [
  { label: "Explain this", question: "Explain the current concept simply, using a visual analogy if helpful." },
  { label: "Quiz me", question: "Give me one short multiple-choice recall question about the current concept. Do not reveal the answer until I respond." },
  { label: "What next?", question: "Based on my current progress, tell me the one anatomy concept I should practice next and why." },
];

function CoachMessage({ content }: { content: string }) {
  const lines = content.replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\r\n?/g, "\n").split("\n");
  return (
    <div className="mimi-coach-message">
      {lines.map((line, index) => {
        const value = line.trim();
        if (!value) return <span className="mimi-coach-message-gap" key={`gap-${index}`} />;
        const choice = /^([A-Z]|\d+)[.)]\s+/.test(value);
        return <p className={choice ? "mimi-coach-choice" : undefined} key={`${value}-${index}`}>{value}</p>;
      })}
    </div>
  );
}

export default function MimiCoach({
  context,
  onExplore,
  onPractice,
}: {
  context: CoachContext;
  onExplore?: (concept?: string) => void;
  onPractice?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<CoachAction[]>([]);
  const [error, setError] = useState("");
  const transcript = useRef<HTMLDivElement>(null);

  const greeting = context.concept
    ? `I’m here to help with ${context.concept}. Want a quick explanation or a mini-quiz?`
    : "I can explain anatomy, quiz you, or point you to the best next practice.";

  useEffect(() => {
    if (open) transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const ask = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;
    setError("");
    setActions([]);
    setInput("");
    setMessages((current) => [...current, { role: "learner", content: cleanQuestion }]);
    setLoading(true);
    try {
      const response = await fetch("/api/mimi-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, context }),
      });
      const data = (await response.json()) as { answer?: string; actions?: CoachAction[]; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error ?? "Mimi Coach could not answer.");
      setMessages((current) => [...current, { role: "coach", content: data.answer as string }]);
      setActions(Array.isArray(data.actions) ? data.actions.slice(0, 2) : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mimi Coach could not answer.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(input);
  };

  const runAction = (action: CoachAction) => {
    if (action.type === "open_atlas") onExplore?.(action.concept ?? context.concept);
    if (action.type === "open_practice") onPractice?.();
    setOpen(false);
  };

  return (
    <aside className={`mimi-coach ${open ? "open" : ""}`} aria-label="Mimi Coach">
      {open && (
        <section className="mimi-coach-panel" role="dialog" aria-label="Chat with Mimi Coach">
          <header>
            <span className="mimi-coach-avatar"><Bot size={20} /></span>
            <span><b>Mimi Coach</b><small><i /> AI anatomy tutor</small></span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Mimi Coach"><X size={19} /></button>
          </header>
          <div className="mimi-coach-context">
            <Sparkles size={15} /> {context.concept ? `Studying ${context.concept}` : "Personalized to your learning path"}
          </div>
          <div className="mimi-coach-transcript" ref={transcript} aria-live="polite">
            <article className="coach"><Bot size={15} /><CoachMessage content={greeting} /></article>
            {messages.map((message, index) => (
              <article className={message.role} key={`${message.role}-${index}`}>
                {message.role === "coach" && <Bot size={15} />}
                {message.role === "coach" ? <CoachMessage content={message.content} /> : <p>{message.content}</p>}
              </article>
            ))}
            {loading && <article className="coach thinking"><Bot size={15} /><p><span /> <span /> <span /></p></article>}
          </div>
          {actions.length > 0 && (
            <div className="mimi-coach-actions">
              {actions.map((action, index) => (
                <button type="button" key={`${action.type}-${index}`} onClick={() => runAction(action)}>
                  <Sparkles size={14} /> {action.label}
                </button>
              ))}
            </div>
          )}
          {messages.length === 0 && (
            <div className="mimi-coach-prompts">
              {prompts.map((prompt) => <button type="button" key={prompt.label} onClick={() => void ask(prompt.question)}>{prompt.label}</button>)}
            </div>
          )}
          {error && <p className="mimi-coach-error">{error}</p>}
          <form onSubmit={submit}>
            <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={600} placeholder="Ask about this anatomy…" aria-label="Ask Mimi Coach" />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send question"><Send size={17} /></button>
          </form>
          <footer>Educational support only · Not medical advice</footer>
        </section>
      )}
      <button className="mimi-coach-launcher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? <ChevronDown size={21} /> : <MessageCircle size={21} />}
        <span>{open ? "Hide coach" : "Ask Mimi"}</span>
        {!open && <i>AI</i>}
      </button>
    </aside>
  );
}
