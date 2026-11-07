"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { submitWork } from "@/lib/api";

export default function FreelancerPage() {
  const [order, setOrder] = useState(null);
  const [submittedCode, setSubmittedCode] = useState("function square(x) {\n  return x * x;\n}");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("escrowOrder");
    if (saved) {
      try {
        setOrder(JSON.parse(saved));
      } catch {
        localStorage.removeItem("escrowOrder");
      }
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "auditing") {
      return;
    }

    if (!order?.orderId) {
      setError("Create an escrow order from the Client view first.");
      return;
    }

    setStatus("auditing");
    setError("");
    setResult(null);

    try {
      const data = await submitWork({
        orderId: order.orderId,
        requirements: order.requirements,
        submittedCode,
      });
      setResult(data);
      setStatus(data.status === "APPROVED" ? "approved" : "rejected");
      if (data.status === "APPROVED") {
        localStorage.setItem(
          "escrowOrder",
          JSON.stringify({ ...order, status: "COMPLETED" }),
        );
      }
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }

  return (
    <Shell eyebrow="Freelancer console" title="Prove the work. Release the funds." description="Submit the deliverable against the client’s criteria. The configured AI auditor evaluates it, and an approved result triggers PayPal capture.">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <aside className="rounded-3xl border border-white bg-white p-7 shadow-xl shadow-slate-900/5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Active escrow</p>
          {order ? (
            <div className="mt-6 grid gap-5">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Order ID</p>
                <code className="mt-1 block break-all text-sm text-slate-700">{order.orderId}</code>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Budget</p>
                <p className="mt-1 text-3xl font-black">${Number(order.budget).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Acceptance criteria</p>
                <p className="mt-1 leading-6 text-slate-600">{order.requirements}</p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-slate-600">No active escrow found. <Link className="font-bold text-teal-700" href="/client">Create one first.</Link></p>
          )}
        </aside>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white bg-white p-7 shadow-xl shadow-slate-900/5">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Submitted code
            <textarea value={submittedCode} onChange={(event) => setSubmittedCode(event.target.value)} rows={13} className="resize-y rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-teal-100 outline-none ring-teal-500 focus:ring-2" required />
          </label>
          <button disabled={status === "auditing" || !order} className="mt-6 w-full rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
            {status === "auditing" ? "AI auditor is reviewing..." : "Submit for compliance audit"}
          </button>
          {status === "auditing" && <p className="mt-4 animate-pulse text-center text-sm font-semibold text-teal-700">Cross-checking code against the escrow criteria...</p>}
          {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        </form>
      </div>

      {result && (
        <section className={`mt-6 rounded-3xl border p-7 ${status === "approved" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <p className={`text-sm font-black uppercase tracking-[0.16em] ${status === "approved" ? "text-emerald-700" : "text-amber-700"}`}>{result.status}</p>
          <h2 className={`mt-2 text-3xl font-black ${status === "approved" ? "text-emerald-900" : "text-amber-900"}`}>{status === "approved" ? "PayPal payment completed" : "Escrow remains held"}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-700">{result.reason}</p>
          {status === "approved" && <p className="mt-5 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">● COMPLETED</p>}
        </section>
      )}
    </Shell>
  );
}
