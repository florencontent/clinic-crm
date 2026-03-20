import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ZAPI_URL =
  "https://api.z-api.io/instances/3ED9461997AF52F36B7AC638E0CE140F/token/67E42A2367AAA15BA33795A7/send-text";
const ZAPI_TOKEN = "Fc54c130fab3f4768b454ab482ccbac55S";

export async function POST(req: NextRequest) {
  const { conversationId, content, phone, patientId } = await req.json();

  if (!content || !phone) {
    return NextResponse.json({ error: "content and phone required" }, { status: 400 });
  }

  // Send via Z-API
  await fetch(ZAPI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client-token": ZAPI_TOKEN,
    },
    body: JSON.stringify({ phone, message: content }),
  }).catch(() => {});

  // Resolve conversation ID
  let convId: string = conversationId || "";

  if (!convId && patientId) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("patient_id", patientId)
      .maybeSingle();

    if (existing) {
      convId = existing.id;
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ patient_id: patientId, last_message_at: new Date().toISOString() })
        .select("id")
        .single();
      convId = newConv?.id || "";
    }
  }

  // Persist outbound message
  if (convId) {
    await supabase.from("messages").insert({
      conversation_id: convId,
      content,
      direction: "outbound",
      sender: "clinic",
      sent_at: new Date().toISOString(),
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);
  }

  return NextResponse.json({ ok: true });
}
