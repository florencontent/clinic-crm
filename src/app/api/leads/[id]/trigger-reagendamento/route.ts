import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ZAPI_URL = `https://api.z-api.io/instances/3ED9461997AF52F36B7AC638E0CE140F/token/67E42A2367AAA15BA33795A7/send-text`;
const ZAPI_CLIENT_TOKEN = "Fc54c130fab3f4768b454ab482ccbac55S";

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(ZAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({ phone, message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildMessages(name: string, procedure: string): string[] {
  return [
    `Olá ${name}! 👋 Notamos que você não compareceu à sua consulta de ${procedure}. Sabemos que imprevistos acontecem. Gostaríamos de reagendar para você em um horário mais conveniente. 😊\n\nQuando ficaria melhor? Pode me dizer uma preferência de dia e horário?`,
    `Oi ${name}! Ainda conseguimos encaixar você na nossa agenda para ${procedure}. Temos horários disponíveis esta semana. 📅\n\nMe conta: qual seria o melhor momento para você? Manhã ou tarde?`,
    `${name}, esta é nossa última tentativa de contato. 💙 Adoraríamos te receber para o ${procedure} — você já deu o primeiro passo chegando até nós!\n\nSe quiser reagendar, é só responder esta mensagem. Caso contrário, entendemos e ficamos à disposição sempre que precisar. 🙏`,
  ];
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const leadId = params.id;
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const { data: patient, error } = await supabaseAdmin
    .from("patients")
    .select("id, name, phone, procedure_interest, in_rescheduling")
    .eq("id", leadId)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (patient.in_rescheduling) {
    return NextResponse.json({ error: "Lead já está em reagendamento" }, { status: 409 });
  }

  const procedure = patient.procedure_interest || "procedimento";
  const messages = buildMessages(patient.name || "cliente", procedure);

  // Mark as in rescheduling immediately
  await supabaseAdmin
    .from("patients")
    .update({ in_rescheduling: true, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  // Send first message immediately
  const ok = await sendWhatsApp(patient.phone, messages[0]);
  if (!ok) {
    // Revert flag if first message fails
    await supabaseAdmin
      .from("patients")
      .update({ in_rescheduling: false, updated_at: new Date().toISOString() })
      .eq("id", leadId);
    return NextResponse.json({ error: "Falha ao enviar mensagem" }, { status: 502 });
  }

  // Schedule remaining messages via n8n reagendamento workflow
  const N8N_WEBHOOK = process.env.NEXT_PUBLIC_N8N_REAGENDAMENTO_WEBHOOK;
  if (N8N_WEBHOOK) {
    // Send payload to n8n to handle D+1 and D+2 messages + auto-perdido after D+3
    fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        name: patient.name,
        phone: patient.phone,
        procedure,
        message2: messages[1],
        message3: messages[2],
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
