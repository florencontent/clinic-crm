export type LeadStatus = "em_contato" | "agendado" | "compareceu" | "fechado";
export type LeadSource = "Site" | "Meta Ads";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  procedure: string;
  source: LeadSource;
  status: LeadStatus;
  date: string;
  avatar?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: "lead" | "clinic";
  timestamp: string;
}

export interface Conversation {
  leadId: string;
  conversationId: string;
  phone: string;
  leadName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: LeadStatus;
  messages: Message[];
}

export interface Appointment {
  id: string;
  leadName: string;
  procedure: string;
  date: string;
  time: string;
  duration: number; // minutes
  doctor: string;
  notes: string;
}

export const statusLabels: Record<LeadStatus, string> = {
  em_contato: "Em Contato",
  agendado: "Agendado",
  compareceu: "Compareceu",
  fechado: "Fechado",
};

export const statusColors: Record<LeadStatus, string> = {
  em_contato: "bg-yellow-100 text-yellow-800",
  agendado: "bg-blue-100 text-blue-800",
  compareceu: "bg-purple-100 text-purple-800",
  fechado: "bg-green-100 text-green-800",
};

export const columnColors: Record<LeadStatus, string> = {
  em_contato: "border-t-yellow-400",
  agendado: "border-t-blue-400",
  compareceu: "border-t-purple-400",
  fechado: "border-t-green-400",
};

// Meta Ads types
export interface MetaCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  leads: number;
  cpl: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  audience: string;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpl: number;
}

export interface MetaAd {
  id: string;
  name: string;
  adsetId: string;
  campaignId: string;
  creative: string;
  thumbnailUrl?: string;
  objectType?: string;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  cpl: number;
}

export interface MetaDailyMetric {
  date: string;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
}

// Meta Ads mock data
export const metaCampaigns: MetaCampaign[] = [
  { id: "c1", name: "Botox Zona Sul", status: "ACTIVE", spend: 4200, impressions: 85000, clicks: 2380, reach: 62000, leads: 42, cpl: 100, ctr: 2.8, cpc: 1.76, cpm: 49.4 },
  { id: "c2", name: "Harmonização Facial", status: "ACTIVE", spend: 3800, impressions: 72000, clicks: 1944, reach: 55000, leads: 31, cpl: 122.58, ctr: 2.7, cpc: 1.95, cpm: 52.8 },
  { id: "c3", name: "Preenchimento Labial", status: "ACTIVE", spend: 2900, impressions: 58000, clicks: 1566, reach: 44000, leads: 24, cpl: 120.83, ctr: 2.7, cpc: 1.85, cpm: 50.0 },
  { id: "c4", name: "Institucional", status: "PAUSED", spend: 1600, impressions: 45000, clicks: 990, reach: 38000, leads: 9, cpl: 177.78, ctr: 2.2, cpc: 1.62, cpm: 35.6 },
];

export const metaAdSets: MetaAdSet[] = [
  { id: "as1", name: "Mulheres 25-45 SP Capital", campaignId: "c1", campaignName: "Botox Zona Sul", audience: "Mulheres 25-45 SP Capital", spend: 2800, leads: 28, impressions: 56000, clicks: 1568, reach: 41000, frequency: 1.37, ctr: 2.8, cpc: 1.79, cpl: 100 },
  { id: "as2", name: "Interesse Estética 30-50", campaignId: "c1", campaignName: "Botox Zona Sul", audience: "Interesse Estética 30-50", spend: 1400, leads: 14, impressions: 29000, clicks: 812, reach: 8000, frequency: 3.63, ctr: 2.8, cpc: 1.72, cpl: 100 },
  { id: "as3", name: "Lookalike Clientes 1%", campaignId: "c2", campaignName: "Harmonização Facial", audience: "Lookalike Clientes 1%", spend: 2100, leads: 19, impressions: 40000, clicks: 1080, reach: 32000, frequency: 1.25, ctr: 2.7, cpc: 1.94, cpl: 110.5 },
  { id: "as4", name: "Mulheres 25-35 Zona Sul", campaignId: "c2", campaignName: "Harmonização Facial", audience: "Mulheres 25-35 Zona Sul", spend: 1700, leads: 12, impressions: 32000, clicks: 864, reach: 23000, frequency: 1.39, ctr: 2.7, cpc: 1.97, cpl: 141.7 },
  { id: "as5", name: "Retargeting Site 30d", campaignId: "c3", campaignName: "Preenchimento Labial", audience: "Retargeting Site 30d", spend: 1600, leads: 16, impressions: 28000, clicks: 896, reach: 21000, frequency: 1.33, ctr: 3.2, cpc: 1.79, cpl: 100 },
  { id: "as6", name: "Interesse Beleza 20-40", campaignId: "c3", campaignName: "Preenchimento Labial", audience: "Interesse Beleza 20-40", spend: 1300, leads: 8, impressions: 30000, clicks: 670, reach: 7500, frequency: 4.0, ctr: 2.23, cpc: 1.94, cpl: 162.5 },
];

export const metaAds: MetaAd[] = [
  { id: "ad1", name: "Vídeo Antes/Depois Botox", adsetId: "as1", campaignId: "c1", creative: "Vídeo Antes/Depois Botox", spend: 1500, leads: 16, impressions: 30000, clicks: 840, cpl: 93.75 },
  { id: "ad2", name: "Carrossel Harmonização", adsetId: "as3", campaignId: "c2", creative: "Carrossel Harmonização", spend: 1200, leads: 12, impressions: 24000, clicks: 648, cpl: 100 },
  { id: "ad3", name: "Story Depoimento Paciente", adsetId: "as1", campaignId: "c1", creative: "Story Depoimento Paciente", spend: 1300, leads: 12, impressions: 26000, clicks: 728, cpl: 108.33 },
  { id: "ad4", name: "Reels Procedimento Ao Vivo", adsetId: "as3", campaignId: "c2", creative: "Reels Procedimento Ao Vivo", spend: 900, leads: 7, impressions: 16000, clicks: 432, cpl: 128.57 },
  { id: "ad5", name: "Imagem Promo Preenchimento", adsetId: "as5", campaignId: "c3", creative: "Imagem Promo Preenchimento", spend: 950, leads: 10, impressions: 16000, clicks: 528, cpl: 95 },
  { id: "ad6", name: "Vídeo Dra. Renata Explica", adsetId: "as2", campaignId: "c1", creative: "Vídeo Dra. Renata Explica", spend: 800, leads: 9, impressions: 17000, clicks: 476, cpl: 88.89 },
  { id: "ad7", name: "Carrossel Antes/Depois Lábios", adsetId: "as5", campaignId: "c3", creative: "Carrossel Antes/Depois Lábios", spend: 650, leads: 6, impressions: 12000, clicks: 368, cpl: 108.33 },
  { id: "ad8", name: "Story Bastidores Clínica", adsetId: "as4", campaignId: "c2", creative: "Story Bastidores Clínica", spend: 700, leads: 5, impressions: 14000, clicks: 378, cpl: 140 },
];

export const metaDailyMetrics: MetaDailyMetric[] = [
  { date: "02/02", spend: 820, leads: 6, impressions: 16500, clicks: 462 },
  { date: "03/02", spend: 910, leads: 8, impressions: 18200, clicks: 510 },
  { date: "04/02", spend: 875, leads: 7, impressions: 17500, clicks: 490 },
  { date: "05/02", spend: 950, leads: 9, impressions: 19000, clicks: 532 },
  { date: "06/02", spend: 780, leads: 5, impressions: 15600, clicks: 437 },
  { date: "07/02", spend: 680, leads: 4, impressions: 13600, clicks: 381 },
  { date: "08/02", spend: 720, leads: 5, impressions: 14400, clicks: 403 },
  { date: "09/02", spend: 980, leads: 10, impressions: 19600, clicks: 549 },
  { date: "10/02", spend: 1050, leads: 11, impressions: 21000, clicks: 588 },
  { date: "11/02", spend: 890, leads: 8, impressions: 17800, clicks: 498 },
  { date: "12/02", spend: 920, leads: 7, impressions: 18400, clicks: 515 },
  { date: "13/02", spend: 1100, leads: 12, impressions: 22000, clicks: 616 },
  { date: "14/02", spend: 960, leads: 9, impressions: 19200, clicks: 538 },
  { date: "15/02", spend: 860, leads: 5, impressions: 17200, clicks: 481 },
];

export const metaAdsMetrics = {
  totalSpend: 12500,
  totalLeads: 106,
  cpl: 117.92,
  cpc: 1.82,
  ctr: 2.65,
  reach: 185000,
};

// Video Generator types and mock data
export type VideoStatus = "gerando" | "pronto" | "erro";
export type VideoType = "Captação" | "Remarketing" | "Educativo";

export interface GeneratedVideo {
  id: string;
  type: VideoType;
  targetAudience: string;
  procedure: string;
  differential: string;
  status: VideoStatus;
  createdAt: string;
}

export const videoTypes: VideoType[] = ["Captação", "Remarketing", "Educativo"];

export const mockVideos: GeneratedVideo[] = [
  {
    id: "v1",
    type: "Captação",
    targetAudience: "Mulheres 25-45 anos",
    procedure: "Botox",
    differential: "Resultado natural e indolor",
    status: "pronto",
    createdAt: "2026-02-15",
  },
  {
    id: "v2",
    type: "Educativo",
    targetAudience: "Pacientes existentes",
    procedure: "Harmonização Facial",
    differential: "Pacote combo com desconto",
    status: "pronto",
    createdAt: "2026-02-12",
  },
  {
    id: "v3",
    type: "Remarketing",
    targetAudience: "Visitantes do site",
    procedure: "Preenchimento Labial",
    differential: "Agende sua avaliação gratuita",
    status: "pronto",
    createdAt: "2026-02-10",
  },
  {
    id: "v4",
    type: "Captação",
    targetAudience: "Mulheres 30-50 zona sul",
    procedure: "Peeling Químico",
    differential: "Pele renovada em 1 sessão",
    status: "erro",
    createdAt: "2026-02-08",
  },
];
