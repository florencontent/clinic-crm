import { supabase } from "./supabase";
import type { Lead, LeadStatus, LeadSource, ReminderStatus, Conversation, Message, Appointment, Tag } from "@/data/mock-data";

// ── Status mapping: DB (8 statuses) → Kanban (4 columns) ──

type DbPatientStatus =
  | "novo"
  | "em_contato"
  | "qualificado"
  | "agendado"
  | "confirmado"
  | "compareceu"
  | "fechado"
  | "perdido";

const statusToKanban: Record<DbPatientStatus, LeadStatus> = {
  novo: "em_contato",
  em_contato: "em_contato",
  qualificado: "em_contato",
  agendado: "agendado",
  confirmado: "agendado",
  compareceu: "compareceu",
  fechado: "fechado",
  perdido: "perdido",
};

// Kanban column → DB statuses (for writing back)
export const kanbanToDbStatuses: Record<LeadStatus, DbPatientStatus[]> = {
  em_contato: ["novo", "em_contato", "qualificado"],
  agendado: ["agendado", "confirmado"],
  compareceu: ["compareceu"],
  fechado: ["fechado"],
  perdido: ["perdido"],
};

// When dragging to a column, use the first DB status as default
const kanbanToDefaultDb: Record<LeadStatus, DbPatientStatus> = {
  em_contato: "em_contato",
  agendado: "agendado",
  compareceu: "compareceu",
  fechado: "fechado",
  perdido: "perdido",
};

// ── Source mapping ──

function mapSource(source: string | null): LeadSource {
  if (!source) return "Site";
  if (source === "meta_ads") return "Meta Ads";
  if (source === "organico") return "Orgânico";
  if (source === "indicacao") return "Indicação";
  return "Site";
}

function sourceToDb(source: LeadSource): string {
  if (source === "Meta Ads") return "meta_ads";
  if (source === "Orgânico") return "organico";
  if (source === "Indicação") return "indicacao";
  return "site";
}

// ── Fetch Patients ──

export async function fetchPatients(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching patients:", error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name || "Sem nome",
    phone: p.phone,
    email: p.email || undefined,
    procedure: p.procedure_interest || "",
    source: mapSource(p.source),
    status: statusToKanban[(p.status as DbPatientStatus) || "novo"],
    date: p.created_at ? p.created_at.split("T")[0] : "",
    tags: Array.isArray(p.tags) ? (p.tags as Tag[]) : undefined,
    notes: p.notes || undefined,
    reminderStatus: p.reminder_status as ReminderStatus | undefined,
    agentPaused: p.agent_paused ?? false,
    lossReason: p.loss_reason ?? undefined,
  }));
}

// ── Update patient status (Kanban drag) ──

export async function updatePatientStatus(
  patientId: string,
  kanbanStatus: LeadStatus
): Promise<void> {
  const dbStatus = kanbanToDefaultDb[kanbanStatus];
  const updatePayload: Record<string, unknown> = { status: dbStatus, updated_at: new Date().toISOString() };
  if (kanbanStatus === "agendado") updatePayload.reminder_status = "aguardando";
  else updatePayload.reminder_status = null;
  const { error } = await supabase
    .from("patients")
    .update(updatePayload)
    .eq("id", patientId);

  if (error) {
    console.error("Error updating patient status:", error);
  }
}

// ── Fetch Conversations ──

function mapConvRow(conv: {
  id: string;
  patient_id: string;
  last_message_at: string | null;
  patients: unknown;
  messages: unknown;
}): Conversation {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patient = conv.patients as any as { id: string; name: string | null; status: string; phone: string | null; reminder_status?: string | null } | null;
  const msgs = (conv.messages as Array<{
    id: string;
    content: string | null;
    direction: string;
    sender: string;
    sent_at: string;
  }>) || [];

  const sortedMsgs = [...msgs].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  );

  const mappedMessages: Message[] = sortedMsgs.map((m) => ({
    id: m.id,
    text: m.content || "",
    sender: m.sender === "patient" ? "lead" : "clinic",
    timestamp: m.sent_at
      ? new Date(m.sent_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  }));

  const lastMsg = sortedMsgs[sortedMsgs.length - 1];
  const unreadCount = sortedMsgs.filter(
    (m) => m.direction === "inbound" && m.sender === "patient"
  ).length;

  const patientStatus = patient?.status as DbPatientStatus | undefined;

  return {
    leadId: patient?.id || conv.patient_id,
    conversationId: conv.id,
    phone: patient?.phone || "",
    leadName: patient?.name || "Sem nome",
    lastMessage: lastMsg?.content || "",
    lastTime: lastMsg?.sent_at ? formatRelativeTime(lastMsg.sent_at) : "",
    unread: unreadCount,
    status: statusToKanban[patientStatus || "novo"],
    messages: mappedMessages,
    reminderStatus: patient?.reminder_status as ReminderStatus | undefined,
  };
}

export async function fetchConversations(): Promise<Conversation[]> {
  // Fetch conversations with messages
  const { data: convData, error } = await supabase
    .from("conversations")
    .select(`
      id,
      patient_id,
      last_message_at,
      patients ( id, name, status, phone, reminder_status ),
      messages ( id, content, direction, sender, sent_at )
    `)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
  }

  const convResults: Conversation[] = (convData || []).map(mapConvRow);
  const patientIdsWithConv = new Set(convResults.map((c) => c.leadId));

  // Fetch all patients to include those without conversations yet
  const { data: allPatients } = await supabase
    .from("patients")
    .select("id, name, status, phone")
    .order("created_at", { ascending: false });

  const emptyConvs: Conversation[] = (allPatients || [])
    .filter((p) => !patientIdsWithConv.has(p.id))
    .map((p) => ({
      leadId: p.id,
      conversationId: "",
      phone: p.phone || "",
      leadName: p.name || "Sem nome",
      lastMessage: "",
      lastTime: "",
      unread: 0,
      status: statusToKanban[(p.status as DbPatientStatus) || "novo"],
      messages: [],
    }));

  return [...convResults, ...emptyConvs];
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ── Create Patient ──

export async function createPatient(data: {
  name: string;
  phone: string;
  procedure: string;
  source: "site" | "meta_ads" | "indicacao" | "organico";
  email?: string;
  notes?: string;
  tags?: Tag[];
}): Promise<Lead | null> {
  const { data: result, error } = await supabase
    .from("patients")
    .insert({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      procedure_interest: data.procedure,
      source: data.source,
      status: "em_contato",
      notes: data.notes || null,
      tags: data.tags || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !result) {
    console.error("Error creating patient:", error);
    return null;
  }

  return {
    id: result.id,
    name: result.name || "Sem nome",
    phone: result.phone || "",
    email: result.email || undefined,
    procedure: result.procedure_interest || "",
    source: mapSource(result.source),
    status: "em_contato",
    date: result.created_at?.split("T")[0] || "",
    tags: Array.isArray(result.tags) ? (result.tags as Tag[]) : undefined,
  };
}

// ── Update Patient ──

export async function updatePatient(
  patientId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    source?: LeadSource;
    status?: LeadStatus;
    tags?: Tag[];
    notes?: string;
  }
): Promise<Lead | null> {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.email !== undefined) updatePayload.email = data.email || null;
  if (data.source !== undefined) updatePayload.source = sourceToDb(data.source);
  if (data.status !== undefined) updatePayload.status = kanbanToDefaultDb[data.status];
  if (data.tags !== undefined) updatePayload.tags = data.tags;
  if (data.notes !== undefined) updatePayload.notes = data.notes;

  const { data: result, error } = await supabase
    .from("patients")
    .update(updatePayload)
    .eq("id", patientId)
    .select()
    .single();

  if (error || !result) {
    console.error("Error updating patient:", error);
    return null;
  }

  return {
    id: result.id,
    name: result.name || "Sem nome",
    phone: result.phone || "",
    email: result.email || undefined,
    procedure: result.procedure_interest || "",
    source: mapSource(result.source),
    status: statusToKanban[(result.status as DbPatientStatus) || "novo"],
    date: result.created_at?.split("T")[0] || "",
    tags: Array.isArray(result.tags) ? (result.tags as Tag[]) : undefined,
    notes: result.notes || undefined,
  };
}

// ── Import Patients (batch) ──

export async function importPatients(
  leads: Array<{
    name: string;
    phone: string;
    email?: string;
    procedure?: string;
    source?: string;
    notes?: string;
  }>
): Promise<number> {
  const rows = leads.map((l) => ({
    name: l.name,
    phone: l.phone,
    email: l.email || null,
    procedure_interest: l.procedure || "",
    source: l.source || "site",
    notes: l.notes || null,
    status: "em_contato",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("patients")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("Error importing patients:", error);
    return 0;
  }
  return (data || []).length;
}

// ── Search Patients ──

export async function searchPatients(
  query: string
): Promise<Array<{ id: string; name: string; phone: string }>> {
  if (!query || query.length < 2) return [];
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, phone")
    .ilike("name", `%${query}%`)
    .limit(6);
  if (error) return [];
  return (data || []).map((p) => ({ id: p.id, name: p.name || "", phone: p.phone || "" }));
}

// ── Google Calendar Sync ──

async function triggerGoogleCalendarSync(data: {
  leadName: string;
  phone: string;
  email?: string;
  procedure?: string;
  date: string;
  time: string;
  duration?: number;
  doctor?: string;
  notes?: string;
}): Promise<void> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_CALENDAR_WEBHOOK;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // silently skip
  }
}

// ── Create Appointment ──

async function upsertProcedure(name: string): Promise<string | null> {
  if (!name.trim()) return null;
  const { data: existing } = await supabase
    .from("procedures")
    .select("id")
    .ilike("name", name.trim())
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from("procedures")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  return created?.id || null;
}

export async function fetchDoctors(): Promise<Array<{ id: string; name: string }>> {
  try {
    const res = await fetch("/api/doctors");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function deleteDoctorById(id: string): Promise<boolean> {
  try {
    const res = await fetch("/api/doctors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function upsertDoctor(name: string): Promise<string | null> {
  if (!name.trim()) return null;
  const { data: existing } = await supabase
    .from("doctors")
    .select("id")
    .ilike("name", name.trim())
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from("doctors")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  return created?.id || null;
}

export async function createAppointment(data: {
  patientId: string;
  date: string;
  startTime: string;
  duration: number;
  procedure?: string;
  doctor?: string;
  notes?: string;
}): Promise<string | null> {
  const [h, m] = data.startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + data.duration;
  const endTime = `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;

  const [procedureId, doctorId] = await Promise.all([
    data.procedure ? upsertProcedure(data.procedure) : Promise.resolve(null),
    data.doctor ? upsertDoctor(data.doctor) : Promise.resolve(null),
  ]);

  const insertData: Record<string, unknown> = {
    patient_id: data.patientId,
    date: data.date,
    start_time: data.startTime,
    end_time: endTime,
    status: "agendado",
    notes: data.notes || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (procedureId) insertData.procedure_id = procedureId;
  if (doctorId) insertData.doctor_id = doctorId;

  const { data: result, error } = await supabase
    .from("appointments")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    return null;
  }

  // Fetch patient info for calendar sync
  if (result?.id) {
    const { data: patient } = await supabase
      .from("patients")
      .select("name, phone, email")
      .eq("id", data.patientId)
      .maybeSingle();

    triggerGoogleCalendarSync({
      leadName: patient?.name || "",
      phone: patient?.phone || "",
      email: patient?.email || undefined,
      procedure: data.procedure,
      date: data.date,
      time: data.startTime,
      duration: data.duration,
      doctor: data.doctor,
      notes: data.notes,
    });
  }

  return result?.id || null;
}

// ── Delete Appointment ──

export async function deleteAppointment(id: string): Promise<boolean> {
  // Delete dependent reminders first
  await supabase.from("appointment_reminders").delete().eq("appointment_id", id);
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  return !error;
}

async function triggerGoogleCalendarDelete(data: {
  leadName: string;
  procedure?: string;
  date: string;
  time: string;
}): Promise<void> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_CALENDAR_DELETE_WEBHOOK;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // silently skip
  }
}

export async function deleteAppointmentWithCalendar(
  id: string,
  eventData: { leadName: string; procedure?: string; date: string; time: string }
): Promise<boolean> {
  const ok = await deleteAppointment(id);
  if (ok) triggerGoogleCalendarDelete(eventData);
  return ok;
}

// ── Dashboard Metrics by Date Range ──

export async function fetchDashboardMetricsByRange(from: string, to: string): Promise<{
  totalLeads: number;
  agendados: number;
  compareceram: number;
  totalSales: number;
}> {
  const { data } = await supabase
    .from("patients")
    .select("status")
    .gte("created_at", from)
    .lte("created_at", to);

  const all = data || [];
  return {
    totalLeads: all.length,
    agendados: all.filter((p) => ["agendado", "confirmado"].includes(p.status)).length,
    compareceram: all.filter((p) => p.status === "compareceu").length,
    totalSales: all.filter((p) => p.status === "fechado").length,
  };
}

// ── Fetch Appointments ──

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      patient_id,
      date,
      start_time,
      end_time,
      notes,
      status,
      patients ( name, reminder_status, procedure_interest, notes ),
      procedures ( name ),
      doctors ( name )
    `)
    .in("status", ["agendado", "confirmado", "compareceu"])
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return (data || []).map((apt) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patient = apt.patients as any as { name: string | null; reminder_status: string | null; procedure_interest: string | null; notes: string | null } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const procedure = apt.procedures as any as { name: string | null } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doctor = apt.doctors as any as { name: string | null } | null;

    // Calculate duration from start_time and end_time
    let duration = 60;
    if (apt.start_time && apt.end_time) {
      const [sh, sm] = apt.start_time.split(":").map(Number);
      const [eh, em] = apt.end_time.split(":").map(Number);
      duration = (eh * 60 + em) - (sh * 60 + sm);
    }

    return {
      id: apt.id,
      patientId: apt.patient_id || undefined,
      leadName: patient?.name || "Sem nome",
      procedure: procedure?.name || patient?.procedure_interest || "",
      date: apt.date,
      time: apt.start_time ? apt.start_time.substring(0, 5) : "",
      duration,
      doctor: doctor?.name || "",
      notes: apt.notes || "",
      status: apt.status || undefined,
      reminderStatus: (patient?.reminder_status as ReminderStatus) || undefined,
      patientNotes: patient?.notes || undefined,
    };
  });
}

// ── Dashboard Metrics ──

export interface DashboardData {
  metrics: {
    totalLeads: number;
    totalSales: number;
  };
  funnel: Array<{ stage: string; value: number; fill: string }>;
  source: Array<{ name: string; value: number; fill: string }>;
  sourceAgendamentos: Array<{ name: string; value: number; fill: string }>;
  sourceVendas: Array<{ name: string; value: number; fill: string }>;
  conversion: Array<{ name: string; value: number }>;
  dailyFechados: Array<{ date: string; count: number }>;
}

// ── Fetch daily fechados by date range ──

export async function fetchDailyFechados(from: string, to: string): Promise<Array<{ date: string; count: number }>> {
  const { data, error } = await supabase
    .from("patients")
    .select("updated_at")
    .eq("status", "fechado")
    .gte("updated_at", from)
    .lte("updated_at", to);

  if (error || !data) return [];

  const map = new Map<string, number>();
  for (const p of data) {
    const date = (p.updated_at as string)?.split("T")[0];
    if (date) map.set(date, (map.get(date) || 0) + 1);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

export async function fetchDashboardMetrics(): Promise<DashboardData> {
  const { data: patients, error } = await supabase
    .from("patients")
    .select("status, source");

  if (error) {
    console.error("Error fetching dashboard metrics:", error);
    return emptyDashboard();
  }

  const all = patients || [];
  const total = all.length;

  // Count by kanban status
  const agendados = all.filter((p) => p.status === "agendado" || p.status === "confirmado").length;
  const compareceram = all.filter((p) => p.status === "compareceu").length;
  const fechados = all.filter((p) => p.status === "fechado").length;

  // Source counts — leads
  const metaAds = all.filter((p) => p.source === "meta_ads").length;
  const site = all.filter((p) => p.source === "site").length;
  const indicacao = all.filter((p) => p.source === "indicacao").length;
  const organico = all.filter((p) => p.source === "organico").length;
  const outros = total - metaAds - site - indicacao - organico;

  // Source counts — agendamentos
  const agendadosAll = all.filter((p) => ["agendado", "confirmado", "compareceu", "fechado"].includes(p.status));
  const agMetaAds = agendadosAll.filter((p) => p.source === "meta_ads").length;
  const agSite = agendadosAll.filter((p) => p.source === "site").length;
  const agIndicacao = agendadosAll.filter((p) => p.source === "indicacao").length;
  const agOrganico = agendadosAll.filter((p) => p.source === "organico").length;
  const agOutros = agendadosAll.length - agMetaAds - agSite - agIndicacao - agOrganico;

  // Source counts — vendas
  const vendasAll = all.filter((p) => p.status === "fechado");
  const vMetaAds = vendasAll.filter((p) => p.source === "meta_ads").length;
  const vSite = vendasAll.filter((p) => p.source === "site").length;
  const vIndicacao = vendasAll.filter((p) => p.source === "indicacao").length;
  const vOrganico = vendasAll.filter((p) => p.source === "organico").length;
  const vOutros = vendasAll.length - vMetaAds - vSite - vIndicacao - vOrganico;

  // Conversion rates
  const agendamentoRate = total > 0 ? (agendados + compareceram + fechados) / total * 100 : 0;
  const comparecimentoRate = (agendados + compareceram + fechados) > 0 ? (compareceram + fechados) / (agendados + compareceram + fechados) * 100 : 0;
  const vendaRate = (compareceram + fechados) > 0 ? fechados / (compareceram + fechados) * 100 : 0;

  return {
    metrics: {
      totalLeads: total,
      totalSales: fechados,
    },
    funnel: [
      { stage: "Leads", value: total, fill: "#1D4ED8" },
      { stage: "Agendados", value: agendados + compareceram + fechados, fill: "#3B82F6" },
      { stage: "Compareceram", value: compareceram + fechados, fill: "#6D28D9" },
      { stage: "Fechados", value: fechados, fill: "#22C55E" },
    ],
    source: [
      ...(metaAds > 0 ? [{ name: "Meta Ads", value: metaAds, fill: "#3B82F6" }] : []),
      ...(site > 0 ? [{ name: "Site", value: site, fill: "#6366F1" }] : []),
      ...(indicacao > 0 ? [{ name: "Indicacao", value: indicacao, fill: "#8B5CF6" }] : []),
      ...(organico > 0 ? [{ name: "Organico", value: organico, fill: "#22C55E" }] : []),
      ...(outros > 0 ? [{ name: "Outros", value: outros, fill: "#F59E0B" }] : []),
    ],
    sourceAgendamentos: [
      ...(agMetaAds > 0 ? [{ name: "Meta Ads", value: agMetaAds, fill: "#3B82F6" }] : []),
      ...(agSite > 0 ? [{ name: "Site", value: agSite, fill: "#6366F1" }] : []),
      ...(agIndicacao > 0 ? [{ name: "Indicacao", value: agIndicacao, fill: "#8B5CF6" }] : []),
      ...(agOrganico > 0 ? [{ name: "Organico", value: agOrganico, fill: "#22C55E" }] : []),
      ...(agOutros > 0 ? [{ name: "Outros", value: agOutros, fill: "#F59E0B" }] : []),
    ],
    sourceVendas: [
      ...(vMetaAds > 0 ? [{ name: "Meta Ads", value: vMetaAds, fill: "#3B82F6" }] : []),
      ...(vSite > 0 ? [{ name: "Site", value: vSite, fill: "#6366F1" }] : []),
      ...(vIndicacao > 0 ? [{ name: "Indicacao", value: vIndicacao, fill: "#8B5CF6" }] : []),
      ...(vOrganico > 0 ? [{ name: "Organico", value: vOrganico, fill: "#22C55E" }] : []),
      ...(vOutros > 0 ? [{ name: "Outros", value: vOutros, fill: "#F59E0B" }] : []),
    ],
    conversion: [
      { name: "Agendamento", value: Number(agendamentoRate.toFixed(1)) },
      { name: "Comparecimento", value: Number(comparecimentoRate.toFixed(1)) },
      { name: "Venda", value: Number(vendaRate.toFixed(1)) },
    ],
    dailyFechados: [],
  };
}

// ── Delete Patient ──

export async function deletePatient(patientId: string): Promise<boolean> {
  // Delete in FK order
  await supabase.from("messages").delete().in("conversation_id",
    (await supabase.from("conversations").select("id").eq("patient_id", patientId)).data?.map((c: { id: string }) => c.id) || []
  );
  await supabase.from("conversations").delete().eq("patient_id", patientId);
  await supabase.from("appointment_reminders").delete().in("appointment_id",
    (await supabase.from("appointments").select("id").eq("patient_id", patientId)).data?.map((a: { id: string }) => a.id) || []
  );
  await supabase.from("appointments").delete().eq("patient_id", patientId);
  await supabase.from("lead_status_history").delete().eq("patient_id", patientId);
  const { error } = await supabase.from("patients").delete().eq("id", patientId);
  return !error;
}

// ── Update Appointment Doctor ──

export async function updateAppointmentDoctor(appointmentId: string, doctorName: string): Promise<boolean> {
  const doctorId = doctorName ? await upsertDoctor(doctorName) : null;
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  payload.doctor_id = doctorId;
  const { error } = await supabase
    .from("appointments")
    .update(payload)
    .eq("id", appointmentId);
  return !error;
}

// ── Toggle Agent Pause ──

export async function toggleAgentPause(patientId: string, paused: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("patients")
    .update({ agent_paused: paused, updated_at: new Date().toISOString() })
    .eq("id", patientId);
  return !error;
}

// ── Mark as Lost ──

export async function markAsLost(patientId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from("patients")
    .update({ status: "perdido", loss_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", patientId);
  return !error;
}

// ── Reactivate Lead ──

export async function reactivateLead(patientId: string): Promise<boolean> {
  const { error } = await supabase
    .from("patients")
    .update({ status: "em_contato", loss_reason: null, updated_at: new Date().toISOString() })
    .eq("id", patientId);
  return !error;
}

function emptyDashboard(): DashboardData {
  return {
    metrics: { totalLeads: 0, totalSales: 0 },
    funnel: [
      { stage: "Leads", value: 0, fill: "#1D4ED8" },
      { stage: "Agendados", value: 0, fill: "#3B82F6" },
      { stage: "Compareceram", value: 0, fill: "#6D28D9" },
      { stage: "Fechados", value: 0, fill: "#22C55E" },
    ],
    source: [],
    sourceAgendamentos: [],
    sourceVendas: [],
    conversion: [
      { name: "Agendamento", value: 0 },
      { name: "Comparecimento", value: 0 },
      { name: "Venda", value: 0 },
    ],
    dailyFechados: [],
  };
}
