# Peer & Co UK Visitor Visa Chat Prototype

Small Next.js prototype for a no-login visitor visa guidance assistant.

## Features

- Branded chat UI
- OpenAI Responses API backend route
- Server-side API key only
- Curated reference context from official visitor guidance plus Peer & Co advisory notes
- Guardrails: no guarantee language and no legal-advice claims

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
cp .env.example .env.local
```

3. Add your OpenAI key in `.env.local`:

```env
OPENAI_API_KEY=your_new_key_here
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=low
```

4. Start dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Important security note

- Never expose `OPENAI_API_KEY` in frontend/browser code.
- If you shared a key in chat or a screenshot, revoke it and generate a new one.

## Speed tuning

If responses still feel slow, try:

- `OPENAI_MODEL=gpt-4.1-mini` for lower latency
- Keep `OPENAI_REASONING_EFFORT=low`
