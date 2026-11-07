import Link from "next/link";

const cards = [
  {
    title: "Client view",
    body: "Define the deliverable, fund a PayPal Sandbox escrow, and share the approval link.",
    href: "/client",
    label: "Fund an escrow",
  },
  {
    title: "Freelancer view",
    body: "Submit work for an AI compliance review and track the automated payout.",
    href: "/freelancer",
    label: "Submit work",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 lg:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          escrow<span className="text-teal-600">/ai</span>
        </Link>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          PayPal Sandbox
        </span>
      </header>

      <section className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-teal-600">
            Agentic Auto-Escrow
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Payment release that waits for proof.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            A transparent workflow for freelance work: fund the contract,
            submit the deliverable, and let an AI auditor verify the agreement
            before PayPal releases the payout.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/client" className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-teal-700">
              Start as a client
            </Link>
            <Link href="/freelancer" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-teal-500 hover:text-teal-700">
              Open freelancer view
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="group rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1">
              <div className="mb-8 flex items-center justify-between">
                <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                  {card.title}
                </span>
                <span className="text-xl text-teal-600 transition group-hover:translate-x-1">→</span>
              </div>
              <p className="text-lg font-semibold">{card.body}</p>
              <p className="mt-5 text-sm font-bold text-teal-600">{card.label} ↗</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
