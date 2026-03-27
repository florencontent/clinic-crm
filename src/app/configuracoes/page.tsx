"use client";

import { useState } from "react";
import { Plus, X, Ticket, Stethoscope, User, Clipboard, Phone, Mail, ChevronDown, ChevronUp, Pencil, Check } from "lucide-react";
import { useSpecialties } from "@/hooks/use-specialties";
import { useProcedures } from "@/hooks/use-procedures";
import { useDoctors, Doctor } from "@/hooks/use-doctors";
import { cn } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const { specialties, addSpecialty, removeSpecialty } = useSpecialties();
  const { procedures, addProcedure, removeProcedure } = useProcedures();
  const { doctors, addDoctor, updateDoctor, removeDoctor } = useDoctors();

  return (
    <div className="p-8 max-w-[900px]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Ticket className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tickets</h2>
        </div>
        <p className="text-sm text-gray-400 ml-12">
          Gerencie especialidades, procedimentos e doutores para categorizar seus leads
        </p>
      </div>

      <div className="space-y-5">
        <EspecialidadesSection
          items={specialties}
          onAdd={addSpecialty}
          onRemove={(id) => removeSpecialty(id)}
        />
        <ProcedimentosSection
          items={procedures}
          onAdd={addProcedure}
          onRemove={(id) => removeProcedure(id)}
        />
        <DoutoresSection
          doctors={doctors}
          onAdd={addDoctor}
          onUpdate={updateDoctor}
          onRemove={removeDoctor}
        />
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Especialidades, procedimentos e doutores são salvos no banco de dados e sincronizados em toda a aplicação.
      </p>
    </div>
  );
}

/* ─── Especialidades ─────────────────────────────────── */
function EspecialidadesSection({
  items,
  onAdd,
  onRemove,
}: {
  items: Array<{ id: string; name: string }>;
  onAdd: (v: string) => Promise<"added" | "exists" | "error">;
  onRemove: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!input.trim()) return;
    setAdding(true);
    const result = await onAdd(input);
    setAdding(false);
    if (result === "added") { setInput(""); setError(""); }
    else if (result === "exists") { setError("Já existe."); setTimeout(() => setError(""), 2000); }
    else { setError("Erro ao salvar."); setTimeout(() => setError(""), 2000); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
          <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Especialidades</h3>
          <p className="text-xs text-gray-400 mt-0.5">Tratamentos e especialidades oferecidos pela clínica</p>
        </div>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="px-6 py-4">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-4">Nenhuma especialidade cadastrada ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {items.map((item) => (
              <span key={item.id} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {item.name}
                <button onClick={() => onRemove(item.id)} className="hover:opacity-60 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            placeholder="Ex: Implante Dentário, Ortodontia..."
            className={cn(
              "flex-1 px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder-gray-400",
              error ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700 focus:border-blue-400"
            )}
          />
          <button onClick={handleAdd} disabled={!input.trim() || adding} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors">
            <Plus className="h-3.5 w-3.5" />
            {adding ? "..." : "Adicionar"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}

/* ─── Procedimentos ──────────────────────────────────── */
function ProcedimentosSection({
  items,
  onAdd,
  onRemove,
}: {
  items: Array<{ id: string; name: string; description?: string }>;
  onAdd: (name: string, description?: string) => Promise<"added" | "exists" | "error">;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    const result = await onAdd(name, desc || undefined);
    setAdding(false);
    if (result === "added") { setName(""); setDesc(""); setShowDesc(false); setError(""); }
    else if (result === "exists") { setError("Já existe."); setTimeout(() => setError(""), 2000); }
    else { setError("Erro ao salvar."); setTimeout(() => setError(""), 2000); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
          <Clipboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Procedimentos</h3>
          <p className="text-xs text-gray-400 mt-0.5">Procedimentos clínicos realizados na clínica</p>
        </div>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="px-6 py-4">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-4">Nenhum procedimento cadastrado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {items.map((item) => (
              <span key={item.id} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 group relative" title={item.description || ""}>
                {item.name}
                <button onClick={() => onRemove(item.id)} className="hover:opacity-60 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder="Ex: Avaliação Inicial, Cirurgia Guiada..."
              className={cn(
                "flex-1 px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder-gray-400",
                error ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700 focus:border-emerald-400"
              )}
            />
            <button
              onClick={() => setShowDesc(!showDesc)}
              className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Adicionar descrição"
            >
              {showDesc ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button onClick={handleAdd} disabled={!name.trim() || adding} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white transition-colors">
              <Plus className="h-3.5 w-3.5" />
              {adding ? "..." : "Adicionar"}
            </button>
          </div>
          {showDesc && (
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Descrição opcional..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-400 transition-colors placeholder-gray-400"
            />
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}

/* ─── Doutores ───────────────────────────────────────── */
function DoutoresSection({
  doctors,
  onAdd,
  onUpdate,
  onRemove,
}: {
  doctors: Doctor[];
  onAdd: (name: string, specialty?: string, whatsapp?: string, email?: string) => Promise<"added" | "exists" | "error">;
  onUpdate: (doctor: Doctor) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", specialty: "", whatsapp: "", email: "" });
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Doctor>({ id: "", name: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setAdding(true);
    const result = await onAdd(form.name, form.specialty || undefined, form.whatsapp || undefined, form.email || undefined);
    setAdding(false);
    if (result === "added") { setForm({ name: "", specialty: "", whatsapp: "", email: "" }); setError(""); }
    else if (result === "exists") { setError("Esse doutor já existe."); setTimeout(() => setError(""), 2500); }
    else { setError("Erro ao salvar. Tente novamente."); setTimeout(() => setError(""), 2500); }
  };

  const startEdit = (d: Doctor) => {
    setEditId(d.id);
    setEditForm({ ...d });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await onUpdate(editForm);
    setSaving(false);
    setEditId(null);
  };

  const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-purple-400 transition-colors placeholder-gray-400";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40">
          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Doutores</h3>
          <p className="text-xs text-gray-400 mt-0.5">Profissionais que atendem na clínica</p>
        </div>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {doctors.length}
        </span>
      </div>
      <div className="px-6 py-4 space-y-4">

        {/* Doctor list */}
        {doctors.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Nenhum doutor cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {doctors.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {editId === d.id ? (
                  <div className="p-4 space-y-2 bg-purple-50 dark:bg-purple-900/20">
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nome" className={inputCls} />
                    <input value={editForm.specialty || ""} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} placeholder="Especialidade" className={inputCls} />
                    <div className="flex gap-2">
                      <input value={editForm.whatsapp || ""} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} placeholder="WhatsApp" className={inputCls} />
                      <input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="E-mail" className={inputCls} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSaveEdit} disabled={saving || !editForm.name.trim()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white transition-colors">
                        <Check className="h-3 w-3" />
                        {saving ? "Salvando..." : "Salvar"}
                      </button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.name}</p>
                      {d.specialty && <p className="text-xs text-gray-500 dark:text-gray-400">{d.specialty}</p>}
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {d.whatsapp && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="h-3 w-3" />{d.whatsapp}
                          </span>
                        )}
                        {d.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail className="h-3 w-3" />{d.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onRemove(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Novo Doutor</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }} placeholder="Nome *" className={cn(inputCls, error ? "border-red-300 dark:border-red-700" : "")} />
            <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Especialidade" className={inputCls} />
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp" className={inputCls} />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" className={inputCls} />
          </div>
          <button onClick={handleAdd} disabled={!form.name.trim() || adding} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white transition-colors">
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Adicionando..." : "Adicionar Doutor"}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
