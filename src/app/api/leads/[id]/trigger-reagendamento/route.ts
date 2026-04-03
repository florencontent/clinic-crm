import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ZAPI_URL = `https://api.z-api.io/instances/3ED9461997AF52F36B7AC638E0CE140F/token/67E42A2367AAA15BA33795A7/send-text`;
const ZAPI_CLIENT_TOKEN = "Fc54c130fab3f4768b454ab482ccbac55S";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const leadId = params.id;
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const { data: patient, error } = await supabaseAdmin
    .from("patients")
    .select("id, name, phone, procedure_interest")
    .eq("id", leadId)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const procedure = patient.procedure_interest || "procedimento";
  const message = `Olá ${patient.name}! 👋 Notamos que você não compareceu à sua consulta de ${procedure}. Sem problemas — gostaríamos de reagendar para você. 😊\n\nQuando ficaria melhor? Pode me dizer um dia e horário de preferência?`;

  try {
    const res = await fetch(ZAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({
        phone: patient.phone,
        message,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Z-API error:", res.status, body);
      return NextResponse.json({ error: "Falha ao enviar mensagem", detail: body }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reagendamento error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
