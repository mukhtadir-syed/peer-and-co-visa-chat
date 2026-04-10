import { ChatWindow } from "@/components/chat-window";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-8">
      <main className="w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1f3a8a]">Peer & Co</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            UK Visitor Visa Assistant
          </h1>
          <p className="max-w-2xl text-slate-600">
            Understand the process, prepare stronger evidence, and get practical guidance in plain
            language.
          </p>
        </header>

        <section className="h-[68vh] min-h-[560px]">
          <ChatWindow />
        </section>
      </main>
    </div>
  );
}
