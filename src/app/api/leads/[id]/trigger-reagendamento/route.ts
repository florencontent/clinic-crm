import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const leadId = params.id;
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const { data: patient, error } = await supabaseAdmin
    .from("patients")
    .select("id, name, phone, email, procedure_interest, status")
    .eq("id", leadId)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const webhookUrl = process.env.N8N_REAGENDAMENTO_WEBHOOK;
  if (!webhookUrl) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        procedure: patient.procedure_interest,
        status: patient.status,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Falha ao acionar webhook" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
