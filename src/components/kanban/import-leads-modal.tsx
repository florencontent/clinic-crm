"use client";

import { useState, useRef } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { importPatients } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ImportLeadsModalProps {
  onClose: () => void;
  onImported: (count: number) => void;
}

type ColumnKey = "name" | "phone" | "email" | "procedure" | "source" | "notes" | "ignore";

const COLUMN_OPTIONS: { value: ColumnKey; label: string }[] = [
  { value: "name", label: "Nome" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "Email" },
  { value: "procedure", label: "Procedimento" },
  { value: "source", label: "Origem" },
  { value: "notes", label: "Observações" },
  { value: "ignore", label: "Ignorar" },
];

function detectColumn(header: string): ColumnKey {
  const h = header.toLowerCase().trim();
  if (/nome|name|paciente/.test(h)) return "name";
  if (/tel|phone|celular|whatsapp|fone/.test(h)) return "phone";
  if (/email|e-mail|mail/.test(h)) return "email";
  if (/proc|trat|interesse|servi/.test(h)) return "procedure";
  if (/orig|source/.test(h)) return "source";
  if (/obs|note|anota|coment/.test(h)) return "notes";
  return "ignore";
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    // Handle quoted fields
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    const sep = line.includes(";") ? ";" : ",";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === sep && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function ImportLeadsModal({ onClose, onImported }: ImportLeadsModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnKey[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        setError("O arquivo deve ter pelo menos um cabeçalho e uma linha de dados.");
        return;
      }
      const hdrs = parsed[0];
      const dataRows = parsed.slice(1).filter((r) => r.some((c) => c.trim()));
      setHeaders(hdrs);
      setRows(dataRows.slice(0, 200)); // limit
      setMapping(hdrs.map(detectColumn));
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
  };

  const handleImport = async () => {
    const nameIdx = mapping.indexOf("name");
    if (nameIdx === -1) {
      setError("Mapeie pelo menos a coluna Nome.");
      return;
    }
    setImporting(true);
    setError(null);

    const leads = rows
      .map((row) => {
        const get = (key: ColumnKey) => {
          const idx = mapping.indexOf(key);
          return idx >= 0 ? (row[idx] || "").trim() : "";
        };
        return {
          name: get("name"),
          phone: get("phone"),
          email: get("email") || undefined,
          procedure: get("procedure") || undefined,
          source: get("source") || "site",
          notes: get("notes") || undefined,
        };
      })
      .filter((l) => l.name);

    const count = await importPatients(leads);
    setImporting(false);
    if (count > 0) {
      setResult({ success: true, count });
    } else {
      setResult({ success: false, count: 0 });
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Importar Leads via CSV</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Result state */}
          {result ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-10 gap-4",
            )}>
              {result.success ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {result.count} lead{result.count !== 1 ? "s" : ""} importado{result.count !== 1 ? "s" : ""} com sucesso!
                  </p>
                  <button
                    onClick={() => onImported(result.count)}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Erro ao importar leads</p>
                  <button
                    onClick={() => setResult(null)}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Tentar novamente
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Upload area */}
              {rows.length === 0 && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Arraste um arquivo CSV ou clique para selecionar</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Separador: vírgula ou ponto-e-vírgula</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Column mapping + preview */}
              {rows.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {rows.length} linha{rows.length !== 1 ? "s" : ""} encontrada{rows.length !== 1 ? "s" : ""}
                    </p>
                    <button
                      onClick={() => { setHeaders([]); setRows([]); setMapping([]); }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Trocar arquivo
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          {headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-gray-400">{h}</span>
                                <select
                                  value={mapping[i] || "ignore"}
                                  onChange={(e) => {
                                    const newMapping = [...mapping];
                                    newMapping[i] = e.target.value as ColumnKey;
                                    setMapping(newMapping);
                                  }}
                                  className="block w-full px-1.5 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none"
                                >
                                  {COLUMN_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, ri) => (
                          <tr key={ri} className={cn("border-b border-gray-50 dark:border-gray-800", ri % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/30")}>
                            {headers.map((_, ci) => (
                              <td key={ci} className={cn("px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[120px]", mapping[ci] === "ignore" ? "opacity-40" : "")}>
                                {row[ci] || ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rows.length > 5 && (
                    <p className="text-[10px] text-gray-400 text-center">Mostrando 5 de {rows.length} linhas</p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && rows.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={importing || rows.length === 0}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${rows.filter((r) => (r[mapping.indexOf("name")] || "").trim()).length} leads`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
