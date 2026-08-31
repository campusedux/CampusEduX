"use client";

import { useState } from "react";
import { submitContactMessageAction } from "@/lib/actions/contact";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const result = await submitContactMessageAction({ name, email, message });
    if ("error" in result) {
      setStatus("idle");
      setError(result.error);
      return;
    }
    setStatus("sent");
    setName("");
    setEmail("");
    setMessage("");
  }

  if (status === "sent") {
    return (
      <div className="mt-8 border border-emerald/40 bg-white p-5">
        <div className="font-serif text-navy">Thanks — your message has been sent.</div>
        <p className="mt-1 text-sm text-slate">The CampusEduX team will get back to you by email.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 text-xs text-navy underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-4">
      <div>
        <label className="text-sm text-navy">Your name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-navy">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-navy">Message</label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          minLength={10}
          maxLength={5000}
          className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-sm bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy/90 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-slate">
        For account-specific issues (a purchase, application, wallet or Premium), signing in and contacting from your
        account lets the team see your context directly.
      </p>
    </form>
  );
}
