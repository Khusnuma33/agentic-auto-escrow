"use client";

import { useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { createOrder } from "@/lib/api";

export default function ClientPage() {
  const [budget, setBudget] = useState("50");
  const [requirements, setRequirements] = useState("Write a function that calculates the square of a number.");
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const data = await createOrder(budget);
      const approvalLink = data.links?.find((link) =>
        ["approve", "payer-action"].includes(link.rel),
      );
      const saved = { orderId: data.id, budget, requirements, approvalUrl: approvalLink?.href };
      localStorage.setItem("escrowOrder", JSON.stringify(saved));
      setOrder(saved);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }

  return (
    <Shell eyebrow="Client console" title="Fund a project with confidence." description="Create the PayPal Sandbox order, approve it as the client, then hand the order to the freelancer for review.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-white bg-white p-7 shadow-xl shadow-slate-900/5">
          <div className="grid gap-6">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Project budget (USD)
              <input value={budget} onChange={(event) => setBudget(event.target.value)} type="number" min="0.01" step="0.01" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg outline-none ring-teal-500 focus:ring-2" required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Acceptance criteria
              <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} rows={7} className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal leading-6 outline-none ring-teal-500 focus:ring-2" required />
            </label>
            <button disabled={status === "loading"} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">
              {status === "loading" ? "Creating PayPal order..." : "Create escrow order"}
            </button>
            {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          </div>
        </form>

        <aside className="rounded-3xl bg-slate-950 p-7 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300">Workflow</p>
          <ol className="mt-7 grid gap-6">
            {["Create a PayPal Sandbox order", "Approve the order as the client", "Send the order ID to the freelancer"].map((item, index) => (
              <li key={item} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-400 font-black text-slate-950">{index + 1}</span>
                <span className="pt-1 font-semibold text-slate-200">{item}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {status === "success" && order && (
        <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="font-black text-emerald-800">Order created</p>
          <p className="mt-2 text-sm text-emerald-700">Order ID: <code>{order.orderId}</code></p>
          {order.approvalUrl ? (
            <a href={order.approvalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800">Approve in PayPal Sandbox ↗</a>
          ) : (
            <p className="mt-4 text-sm font-semibold text-amber-700">PayPal did not return an approval link. Check the backend response.</p>
          )}
          <Link href="/freelancer" className="ml-3 inline-flex rounded-xl border border-emerald-300 px-5 py-3 font-bold text-emerald-800 hover:bg-white">Open freelancer view</Link>
        </section>
      )}
    </Shell>
  );
}
