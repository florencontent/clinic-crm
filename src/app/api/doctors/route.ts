import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role bypassa RLS — usado apenas server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("doctors")
    .select("id, name, specialty, whatsapp, email")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const { name, specialty, whatsapp, email } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  // Verifica se já existe
  const { data: existing } = await supabaseAdmin
    .from("doctors")
    .select("id")
    .ilike("name", name.trim())
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ exists: true, id: existing.id });

  const { data, error } = await supabaseAdmin
    .from("doctors")
    .insert({
      id: crypto.randomUUID(),
      name: name.trim(),
      specialty: specialty?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      email: email?.trim() || null,
    })
    .select("id, name, specialty, whatsapp, email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { id, name, specialty, whatsapp, email } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("doctors")
    .update({
      name: name?.trim(),
      specialty: specialty?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      email: email?.trim() || null,
    })
    .eq("id", id)
    .select("id, name, specialty, whatsapp, email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const { error } = await supabaseAdmin.from("doctors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
