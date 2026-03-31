"use client";

import { useState } from "react";
import { useDoctors } from "@/lib/doctors-context";
import { useProcedures } from "@/hooks/use-procedures";
import { X } from "lucide-react";
import { Lead, Tag } from "@/data/mock-data";
import { updatePatient } from "@/lib/api";

interface EditLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

export function EditLeadModal({ lead, onClose, onSave }: EditLeadModalProps) {
  const { doctorNames: DOUTORES } = useDoctors();
  const { procedures } = useProcedures();

  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email || "");
  const [procedure, setProcedure] = useState(lead.procedure || "");
  const [tags] = useState<Tag[]>(lead.tags || []);
  const [notes, setNotes] = useState(lead.notes || "");
  const [dealValue, setDealValue] = useState(lead.dealValue != null ? String(lead.dealValue) : "");
  const [doctor, setDoctor] = useState(lead.doctor || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const parsedDeal = dealValue.trim() ? parseFloat(dealValue) : null;
    const updated = await updatePatient(lead.id, {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      tags,
      notes: notes.trim() || undefined,
      dealValue: parsedDeal,
      procedure: procedure.trim() || undefined,
      doctor: doctor || undefined,
    });
    setSaving(false);
    if (updated) {
      onSave(updated);
    } else {
      onSave({ ...lead, name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, tags, notes: notes.trim() || undefined, dealValue: parsedDeal ?? undefined, procedure: procedure.trim() || undefined, doctor: doctor || undefined });
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Editar Lead</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Telefone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className={inputClass + " placeholder-gray-400"} />
          </div>

          <div>
            <label className={labelClass}>Procedimento</label>
            <select value={procedure} onChange={(e) => setProcedure(e.target.value)} className={inputClass}>
              <option value="">Selecionar procedimento...</option>
              {procedures.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              {procedure && !procedures.find((p) => p.name === procedure) && (
                <option value={procedure}>{procedure}</option>
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>Doutor(a)</label>
            <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className={inputClass}>
              <option value="">Selecionar...</option>
              {DOUTORES.map((d) => <option key={d} value={d}>{d}</option>)}
              {doctor && !DOUTORES.includes(doctor) && (
                <option value={doctor}>{doctor}</option>
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>Ticket (R$)</label>
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="0,00"
              className={inputClass + " placeholder-gray-400"}
            />
          </div>

          <div>
            <label className={labelClass}>Observação</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anote informações relevantes sobre o lead: histórico, preferências, restrições..."
              rows={4}
              className={inputClass + " placeholder-gray-400 resize-none text-xs"}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
