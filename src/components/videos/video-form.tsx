"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { videoTypes, type VideoType } from "@/data/mock-data";

interface VideoFormProps {
  onGenerate: (data: {
    type: VideoType;
    targetAudience: string;
    procedure: string;
    differential: string;
  }) => void;
}

export function VideoForm({ onGenerate }: VideoFormProps) {
  const [type, setType] = useState<VideoType>("Captação");
  const [targetAudience, setTargetAudience] = useState("");
  const [procedure, setProcedure] = useState("");
  const [differential, setDifferential] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ type, targetAudience, procedure, differential });
    setTargetAudience("");
    setProcedure("");
    setDifferential("");
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Vídeo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tipo de anúncio</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as VideoType)}
            className={inputClass}
          >
            {videoTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Público-alvo</label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Ex: Mulheres 25-45 anos"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Procedimento</label>
          <input
            type="text"
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            placeholder="Ex: Botox, Harmonização..."
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Diferencial</label>
          <input
            type="text"
            value={differential}
            onChange={(e) => setDifferential(e.target.value)}
            placeholder="Ex: Resultado natural e indolor"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-200 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Gerar Vídeo
        </button>
      </div>
    </form>
  );
}
