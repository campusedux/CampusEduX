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
      <div className="max-h-96 space-y-3 overflow-y-auto border border-navy/10 bg-white p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate">No messages yet. Ask the team anything about your request.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === "student";
            return (
              <div key={m.id} className={mine ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-sm px-3 py-2 text-sm ${
                    mine ? "bg-navy text-paper" : "bg-paper text-navy border border-navy/10"
                  }`}
                >
                  <span className="whitespace-pre-line">{m.body}</span>
                </div>
                <div className="mt-0.5 text-[0.65rem] text-slate">
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
          className="flex-1 border border-navy/20 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="rounded-sm bg-navy px-5 py-2 text-sm text-paper hover:bg-navy/90 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
