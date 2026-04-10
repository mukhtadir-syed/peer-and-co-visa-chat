type StarterPromptsProps = {
  prompts?: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export const DEFAULT_STARTER_PROMPTS = [
  "What documents do I usually need for a UK visitor visa?",
  "How can I show I will return to my home country?",
  "What are common reasons UK visitor visas get refused?",
  "How should I explain a large bank deposit in my application?",
];

export function StarterPrompts({
  prompts = DEFAULT_STARTER_PROMPTS,
  onSelect,
  disabled = false,
}: StarterPromptsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
