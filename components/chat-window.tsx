"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DEFAULT_STARTER_PROMPTS, StarterPrompts } from "@/components/starter-prompts";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const initialAssistantMessage: Message = {
  role: "assistant",
  content:
    "Hello, I am your Peer & Co Visitor Visa Assistant. I can help you understand the UK Standard Visitor process and prepare your documents with clear, practical guidance.",
};

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([initialAssistantMessage]);
  const [nudges, setNudges] = useState<string[]>(DEFAULT_STARTER_PROMPTS);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const canSubmit = useMemo(
    () => !isLoading && input.trim().length > 0,
    [isLoading, input],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  async function submitMessage(text: string) {
    const userMessage: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await res.json()) as {
        reply?: string;
        nudges?: string[];
        error?: string;
      };
      if (!res.ok || !data.reply) {
        throw new Error(data.error || "Could not generate a response.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
      if (Array.isArray(data.nudges) && data.nudges.length > 0) {
        setNudges(data.nudges.slice(0, 4));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await submitMessage(input);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Visitor Visa Chat</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ask questions about process, documents, and preparing a stronger application story.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-auto bg-[#1f3a8a] text-white"
                : "bg-slate-100 text-slate-900"
            }`}
          >
            {message.role === "assistant" ? (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ ...props }) => <h1 {...props} className="text-base font-semibold" />,
                    h2: ({ ...props }) => <h2 {...props} className="text-[15px] font-semibold" />,
                    h3: ({ ...props }) => <h3 {...props} className="text-[14px] font-semibold" />,
                    p: ({ ...props }) => <p {...props} className="text-[14px] leading-6" />,
                    ul: ({ ...props }) => <ul {...props} className="list-disc space-y-1 pl-5" />,
                    ol: ({ ...props }) => <ol {...props} className="list-decimal space-y-1 pl-5" />,
                    li: ({ ...props }) => <li {...props} className="pl-1" />,
                    pre: ({ ...props }) => (
                      <pre
                        {...props}
                        className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100"
                      />
                    ),
                    code: ({ ...props }) => <code {...props} className="markdown-inline-code" />,
                    a: ({ ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline decoration-blue-300 underline-offset-2"
                      />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />

        {isLoading && (
          <div className="max-w-[85%] rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
            Thinking...
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-4">
        <StarterPrompts
          prompts={nudges}
          disabled={isLoading}
          onSelect={(prompt) => void submitMessage(prompt)}
        />

        <form className="mt-3 flex gap-2" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your question..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-[#1f3a8a] placeholder:text-slate-400 focus:ring-2"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-[#1f3a8a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a2f70] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <p className="mt-3 text-xs text-slate-500">
          Guidance only. This assistant does not guarantee outcomes and is not a substitute for legal advice.
        </p>
      </div>
    </div>
  );
}
