"use client";

import Link from "next/link";

export default function Shell({ eyebrow, title, description, children }) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          escrow<span className="text-teal-600">/ai</span>
        </Link>
        <nav className="flex gap-2 text-sm font-semibold">
          <Link href="/client" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-white hover:text-teal-700">Client</Link>
          <Link href="/freelancer" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-white hover:text-teal-700">Freelancer</Link>
        </nav>
      </header>
      <section className="py-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-600">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>
      </section>
      {children}
    </main>
  );
}
