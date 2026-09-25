"use client";

import { useState } from "react";
import { submitContactMessageAction } from "@/lib/actions/contact";
import { Button, Field, Input, Textarea } from "@/components/ui";

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
      <div className="mt-8 rounded-2xl border border-success/40 bg-card p-5 shadow-card">
        <div className="font-semibold text-ink">Thanks — your message has been sent.</div>
        <p className="mt-1 text-sm text-ink-muted">The CampusEduX team will get back to you by email.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 text-xs font-semibold text-primary hover:text-primary-700"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-4">
      <Field label="Your name" htmlFor="contact-name" required>
        <Input
          id="contact-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </Field>
      <Field label="Email" htmlFor="contact-email" required>
        <Input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
        />
      </Field>
      <Field label="Message" htmlFor="contact-message" required>
        <Textarea
          id="contact-message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          minLength={10}
          maxLength={5000}
        />
      </Field>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" loading={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </Button>
      <p className="text-xs text-ink-muted">
        For account-specific issues (a purchase, application, wallet or Premium), signing in and contacting from your
        account lets the team see your context directly.
      </p>
    </form>
  );
}
