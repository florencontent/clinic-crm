"use client";

import { useState } from "react";
import { VideoForm } from "@/components/videos/video-form";
import { VideoList } from "@/components/videos/video-list";
import {
  mockVideos,
  type GeneratedVideo,
  type VideoType,
} from "@/data/mock-data";

export default function VideosPage() {
  const [videos, setVideos] = useState<GeneratedVideo[]>(mockVideos);

  const handleGenerate = (data: {
    type: VideoType;
    targetAudience: string;
    procedure: string;
    differential: string;
  }) => {
    const newVideo: GeneratedVideo = {
      id: `v${Date.now()}`,
      type: data.type,
      targetAudience: data.targetAudience,
      procedure: data.procedure,
      differential: data.differential,
      status: "gerando",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setVideos((prev) => [newVideo, ...prev]);

    // Simulate generation completing after a few seconds
    setTimeout(() => {
      setVideos((prev) =>
        prev.map((v) => (v.id === newVideo.id ? { ...v, status: "pronto" as const } : v))
      );
    }, 4000);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gerador de Vídeos</h2>
        <p className="text-sm text-gray-500 mt-1">Crie vídeos de anúncio com IA</p>
      </div>

      <div className="space-y-6">
        <VideoForm onGenerate={handleGenerate} />
        <VideoList videos={videos} />
      </div>
    </div>
  );
}
