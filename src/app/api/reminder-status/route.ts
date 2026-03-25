import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_STATUSES = ["aguardando", "d2", "d1", "dia"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, reminder_status } = body;

    if (!phone) {
      return NextResponse.json({ error: "phone é obrigatório" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(reminder_status)) {
      return NextResponse.json(
        { error: `reminder_status inválido. Use: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Normaliza o telefone removendo caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, "");

    // Busca o paciente pelo telefone (pode ter ou não o +55)
    const { data: patients, error: fetchError } = await supabase
      .from("patients")
      .select("id, status")
      .or(`phone.eq.${cleanPhone},phone.eq.+55${cleanPhone},phone.eq.55${cleanPhone}`)
      .limit(1);

    if (fetchError || !patients || patients.length === 0) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const patient = patients[0];

    // Só atualiza se o paciente estiver agendado
    if (!["agendado", "confirmado"].includes(patient.status)) {
      return NextResponse.json(
        { message: "Paciente não está agendado, status ignorado", status: patient.status },
        { status: 200 }
      );
    }

    const { error: updateError } = await supabase
      .from("patients")
      .update({ reminder_status, updated_at: new Date().toISOString() })
      .eq("id", patient.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      patient_id: patient.id,
      reminder_status,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
