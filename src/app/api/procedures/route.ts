import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("procedures")
    .select("id, name, description")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("procedures")
    .select("id")
    .ilike("name", name.trim())
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ exists: true, id: existing.id });

  const { data, error } = await supabaseAdmin
    .from("procedures")
    .insert({ id: crypto.randomUUID(), name: name.trim(), description: description?.trim() || null })
    .select("id, name, description")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const { error } = await supabaseAdmin.from("procedures").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
