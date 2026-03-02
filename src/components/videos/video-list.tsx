"use client";

import { Download, Loader2, AlertCircle, Video } from "lucide-react";
import type { GeneratedVideo } from "@/data/mock-data";

interface VideoListProps {
  videos: GeneratedVideo[];
}

const statusConfig = {
  gerando: {
    label: "Gerando...",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Loader2,
    animate: true,
  },
  pronto: {
    label: "Pronto",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: Video,
    animate: false,
  },
  erro: {
    label: "Erro",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: AlertCircle,
    animate: false,
  },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Nenhum vídeo gerado ainda</p>
        <p className="text-sm text-gray-400 mt-1">Use o formulário acima para criar seu primeiro vídeo</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vídeos Gerados</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => {
          const config = statusConfig[video.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={video.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className={`h-36 ${config.bg} flex items-center justify-center`}>
                <StatusIcon
                  className={`h-12 w-12 ${config.text} ${config.animate ? "animate-spin" : ""}`}
                />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{video.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>
                    {config.label}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-1">{video.procedure}</p>
                <p className="text-xs text-gray-400">{formatDate(video.createdAt)}</p>

                {video.status === "pronto" && (
                  <button className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    Baixar
                  </button>
                )}

                {video.status === "erro" && (
                  <button className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                    Tentar novamente
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
