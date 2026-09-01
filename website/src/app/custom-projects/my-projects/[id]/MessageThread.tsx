"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { timeAgo } from "@/lib/format";
import { sendCustomProjectMessageAction } from "@/lib/actions/customProjects";

type Message = { id: string; senderRole: string; body: string; createdAt: string };

export default function MessageThread({
  requestId,
  initialMessages,
}: {
  requestId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    const supabase = createBrowserSupabase();
    const { data } = await supabase
      .from("custom_project_messages")
      .select("id,sender_role,body,created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m: any) => ({ id: m.id, senderRole: m.sender_role, body: m.body, createdAt: m.created_at })));
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const result = await sendCustomProjectMessageAction({ requestId, body: trimmed });
    setSending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setBody("");
    await refresh();
  }

  return (
    <div className="mt-3">
      <div className="max-h-96 space-y-3 overflow-y-auto border border-line bg-white p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-ink-muted">No messages yet. Ask the team anything about your request.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === "student";
            return (
              <div key={m.id} className={mine ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    mine ? "bg-primary text-white" : "bg-surface text-ink border border-line"
                  }`}
                >
                  <span className="whitespace-pre-line">{m.body}</span>
                </div>
                <div className="mt-0.5 text-[0.65rem] text-ink-muted">
                  {mine ? "You" : "CampusEduX team"} · {timeAgo(m.createdAt)}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          placeholder="Write a message…"
          className="h-11 flex-1 rounded-xl border border-line bg-white px-3.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn-primary">
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
