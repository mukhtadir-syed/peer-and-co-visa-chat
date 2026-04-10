import { NextRequest, NextResponse } from "next/server";
import { loadVisaReferenceContext } from "@/lib/context-loader";
import { getModelName, getOpenAIClient, getReasoningEffort } from "@/lib/openai";
import { buildContextBlock, DEVELOPER_INSTRUCTIONS } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rate-limit";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  messages?: ChatMessage[];
};

const TOPIC_NUDGES: Array<{ keywords: string[]; nudges: string[] }> = [
  {
    keywords: ["bank", "salary", "fund", "finance", "money", "deposit", "statement"],
    nudges: [
      "What financial documents should I submit for the last 6 months?",
      "How do I explain a large recent deposit clearly?",
      "Can you help me check if my trip budget looks realistic?",
    ],
  },
  {
    keywords: ["sponsor", "invitation", "host", "family", "friend", "accommodation"],
    nudges: [
      "What should my sponsor letter include to be credible?",
      "Which sponsor documents are usually expected?",
      "How can I show my relationship with the sponsor clearly?",
    ],
  },
  {
    keywords: ["refusal", "rejected", "reject", "denied"],
    nudges: [
      "How do I analyze my refusal reasons step by step?",
      "What should I improve before reapplying?",
      "Can you help me draft a stronger reapplication cover letter?",
    ],
  },
  {
    keywords: ["job", "employment", "self-employed", "business owner", "leave"],
    nudges: [
      "What should an employment letter include for a visitor visa?",
      "How can a self-employed applicant show strong home ties?",
      "How do I present leave approval and return-to-work evidence?",
    ],
  },
  {
    keywords: ["translate", "translation", "english", "welsh", "document language"],
    nudges: [
      "What are the requirements for translated documents?",
      "Can you give me a translation checklist before submission?",
      "How do I verify translation details are complete?",
    ],
  },
  {
    keywords: ["itinerary", "plan", "tourism", "holiday", "travel plan"],
    nudges: [
      "How detailed should my itinerary be for a visitor visa?",
      "Can you help me create a simple day-wise travel plan?",
      "How do I align my itinerary with my budget and documents?",
    ],
  },
];

const FALLBACK_NUDGES = [
  "Can you give me a checklist of documents based on my case?",
  "What are the top risks in my situation and how do I reduce them?",
  "Can you draft a clear cover letter template for my profile?",
  "What evidence best shows that I will return home after my visit?",
];

function sanitizeAssistantReply(text: string): string {
  let cleaned = text
    .replace(
      /^(?:\*\*?\s*)?(?:short answer|direct answer(?: first)?|answer|final answer)\s*(?:\*\*?)?\s*:?\s*\n*/i,
      "",
    )
    .trim();

  // Fix awkward leading fragments like: "— common refusal reasons"
  const headingFragmentMatch = cleaned.match(/^[-—–]\s*([a-z][^\n]{1,90})\s*\n?/i);
  if (headingFragmentMatch) {
    const raw = headingFragmentMatch[1].trim();
    const title = raw.charAt(0).toUpperCase() + raw.slice(1);
    cleaned = cleaned.replace(headingFragmentMatch[0], `## ${title}\n\n`).trim();
  }

  // If the response is cut mid-thought, remove the dangling tail line.
  const lines = cleaned.split("\n");
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    if (!last) {
      lines.pop();
      continue;
    }

    const completeLine = /[.!?:)"\]]$/.test(last);
    if (completeLine) break;

    const words = last.split(/\s+/).filter(Boolean).length;
    if (words <= 12) {
      lines.pop();
      continue;
    }

    lines[lines.length - 1] = `${last}.`;
    break;
  }

  cleaned = lines.join("\n").trim();

  return cleaned;
}

function buildDynamicNudges(messages: ChatMessage[], reply: string): string[] {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const corpus = `${lastUserMessage} ${reply}`.toLowerCase();

  const collected: string[] = [];
  for (const topic of TOPIC_NUDGES) {
    if (topic.keywords.some((keyword) => corpus.includes(keyword))) {
      for (const nudge of topic.nudges) {
        if (!collected.includes(nudge)) collected.push(nudge);
      }
    }
    if (collected.length >= 4) break;
  }

  if (collected.length < 4) {
    for (const fallback of FALLBACK_NUDGES) {
      if (!collected.includes(fallback)) collected.push(fallback);
      if (collected.length >= 4) break;
    }
  }

  return collected.slice(0, 4);
}

function normalizeMessages(messages: ChatMessage[] = []): ChatMessage[] {
  return messages
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-12);
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        {
          error: `Too many requests. Please retry in about ${rateLimitResult.retryAfterSeconds ?? 60} seconds.`,
        },
        { status: 429 },
      );
    }

    const body = (await request.json()) as ChatRequest;
    const messages = normalizeMessages(body.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 },
      );
    }

    const openai = getOpenAIClient();
    const referenceContext = loadVisaReferenceContext();
    const instructions = [DEVELOPER_INSTRUCTIONS, buildContextBlock(referenceContext)].join("\n\n");
    const model = getModelName();
    const isGpt5Family = model.startsWith("gpt-5");

    const response = await openai.responses.create({
      model,
      store: false,
      max_output_tokens: 500,
      instructions,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      ...(isGpt5Family ? { reasoning: { effort: getReasoningEffort() } } : {}),
    });

    const text = sanitizeAssistantReply(response.output_text?.trim() ?? "");
    if (!text) {
      return NextResponse.json(
        { error: "No response text generated. Please try again." },
        { status: 502 },
      );
    }

    const nudges = buildDynamicNudges(messages, text);
    return NextResponse.json({ reply: text, nudges });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while generating response.";

    return NextResponse.json(
      { error: message.includes("OPENAI_API_KEY") ? message : "Chat request failed." },
      { status: 500 },
    );
  }
}
