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
}

export const leads: Lead[] = [
  { id: "1", name: "Ana Paula Silva", phone: "(11) 99123-4567", procedure: "Botox", source: "Meta Ads", status: "em_contato", date: "2026-02-10" },
  { id: "2", name: "Carlos Eduardo Santos", phone: "(11) 98234-5678", procedure: "Preenchimento Labial", source: "Site", status: "em_contato", date: "2026-02-11" },
  { id: "3", name: "Mariana Costa", phone: "(11) 97345-6789", procedure: "Harmonização Facial", source: "Meta Ads", status: "em_contato", date: "2026-02-12" },
  { id: "4", name: "Roberto Almeida", phone: "(11) 96456-7890", procedure: "Limpeza de Pele", source: "Site", status: "em_contato", date: "2026-02-12" },
  { id: "5", name: "Fernanda Lima", phone: "(11) 95567-8901", procedure: "Botox", source: "Meta Ads", status: "agendado", date: "2026-02-08" },
  { id: "6", name: "João Pedro Oliveira", phone: "(11) 94678-9012", procedure: "Peeling Químico", source: "Site", status: "agendado", date: "2026-02-09" },
  { id: "7", name: "Beatriz Rodrigues", phone: "(11) 93789-0123", procedure: "Preenchimento Labial", source: "Meta Ads", status: "agendado", date: "2026-02-07" },
  { id: "8", name: "Lucas Ferreira", phone: "(11) 92890-1234", procedure: "Harmonização Facial", source: "Meta Ads", status: "compareceu", date: "2026-02-05" },
  { id: "9", name: "Juliana Martins", phone: "(11) 91901-2345", procedure: "Botox", source: "Site", status: "compareceu", date: "2026-02-04" },
  { id: "10", name: "Rafael Souza", phone: "(11) 90012-3456", procedure: "Limpeza de Pele", source: "Meta Ads", status: "compareceu", date: "2026-02-06" },
  { id: "11", name: "Camila Nascimento", phone: "(11) 99876-5432", procedure: "Harmonização Facial", source: "Site", status: "fechado", date: "2026-01-28" },
  { id: "12", name: "Thiago Barbosa", phone: "(11) 98765-4321", procedure: "Botox", source: "Meta Ads", status: "fechado", date: "2026-01-30" },
  { id: "13", name: "Patrícia Gomes", phone: "(11) 97654-3210", procedure: "Preenchimento Labial", source: "Meta Ads", status: "fechado", date: "2026-02-01" },
  { id: "14", name: "Diego Mendes", phone: "(11) 96543-2109", procedure: "Peeling Químico", source: "Site", status: "em_contato", date: "2026-02-13" },
  { id: "15", name: "Isabela Teixeira", phone: "(11) 95432-1098", procedure: "Botox", source: "Meta Ads", status: "agendado", date: "2026-02-10" },
  { id: "16", name: "Gustavo Cardoso", phone: "(11) 94321-0987", procedure: "Harmonização Facial", source: "Site", status: "compareceu", date: "2026-02-03" },
];

export const conversations: Conversation[] = [
  {
    leadId: "1",
    leadName: "Ana Paula Silva",
    lastMessage: "Olá, gostaria de saber mais sobre o Botox",
    lastTime: "10:30",
    unread: 2,
    status: "em_contato",
    messages: [
      { id: "m1", text: "Olá, boa tarde! Vi o anúncio de vocês no Instagram sobre Botox. Quanto custa?", sender: "lead", timestamp: "10:15" },
      { id: "m2", text: "Olá Ana Paula! Tudo bem? 😊 O valor do Botox começa a partir de R$ 1.200, dependendo da região a ser aplicada.", sender: "clinic", timestamp: "10:20" },
      { id: "m3", text: "Entendi! E como funciona o agendamento?", sender: "lead", timestamp: "10:25" },
      { id: "m4", text: "Olá, gostaria de saber mais sobre o Botox", sender: "lead", timestamp: "10:30" },
    ],
  },
  {
    leadId: "2",
    leadName: "Carlos Eduardo Santos",
    lastMessage: "Perfeito, vou confirmar com minha esposa",
    lastTime: "09:45",
    unread: 0,
    status: "em_contato",
    messages: [
      { id: "m5", text: "Bom dia! Encontrei vocês pelo Google. Fazem preenchimento labial?", sender: "lead", timestamp: "09:00" },
      { id: "m6", text: "Bom dia Carlos! Sim, realizamos preenchimento labial com ácido hialurônico. Gostaria de agendar uma avaliação?", sender: "clinic", timestamp: "09:10" },
      { id: "m7", text: "Sim! Qual o valor da avaliação?", sender: "lead", timestamp: "09:20" },
      { id: "m8", text: "A avaliação é gratuita! Temos horários disponíveis na terça e quinta. Qual prefere?", sender: "clinic", timestamp: "09:30" },
      { id: "m9", text: "Perfeito, vou confirmar com minha esposa", sender: "lead", timestamp: "09:45" },
    ],
  },
  {
    leadId: "5",
    leadName: "Fernanda Lima",
    lastMessage: "Confirmado! Terça às 14h 👍",
    lastTime: "Ontem",
    unread: 0,
    status: "agendado",
    messages: [
      { id: "m10", text: "Oi! Quero agendar Botox", sender: "lead", timestamp: "14:00" },
      { id: "m11", text: "Olá Fernanda! Que bom! Temos horário na terça-feira às 14h, serve para você?", sender: "clinic", timestamp: "14:15" },
      { id: "m12", text: "Confirmado! Terça às 14h 👍", sender: "lead", timestamp: "14:20" },
    ],
  },
  {
    leadId: "3",
    leadName: "Mariana Costa",
    lastMessage: "Vou pensar e retorno amanhã",
    lastTime: "Ontem",
    unread: 1,
    status: "em_contato",
    messages: [
      { id: "m13", text: "Boa tarde! Vi no Instagram sobre harmonização facial. Gostaria de saber os valores.", sender: "lead", timestamp: "16:00" },
      { id: "m14", text: "Boa tarde Mariana! A harmonização facial é um dos nossos procedimentos mais procurados. Os valores variam de R$ 3.500 a R$ 8.000 dependendo do protocolo.", sender: "clinic", timestamp: "16:10" },
      { id: "m15", text: "Vou pensar e retorno amanhã", sender: "lead", timestamp: "16:30" },
    ],
  },
  {
    leadId: "8",
    leadName: "Lucas Ferreira",
    lastMessage: "Gostei muito do resultado da avaliação!",
    lastTime: "08:20",
    unread: 1,
    status: "compareceu",
    messages: [
      { id: "m16", text: "Bom dia! Estive aí ontem para avaliação da harmonização", sender: "lead", timestamp: "08:00" },
      { id: "m17", text: "Bom dia Lucas! Sim, como foi sua experiência?", sender: "clinic", timestamp: "08:10" },
      { id: "m18", text: "Gostei muito do resultado da avaliação!", sender: "lead", timestamp: "08:20" },
    ],
  },
  {
    leadId: "11",
    leadName: "Camila Nascimento",
    lastMessage: "Muito obrigada! Adorei o resultado! ❤️",
    lastTime: "Seg",
    unread: 0,
    status: "fechado",
    messages: [
      { id: "m19", text: "Dra., a harmonização ficou incrível!", sender: "lead", timestamp: "10:00" },
      { id: "m20", text: "Que bom Camila! Ficou realmente muito natural. Lembre-se dos cuidados pós-procedimento!", sender: "clinic", timestamp: "10:15" },
      { id: "m21", text: "Muito obrigada! Adorei o resultado! ❤️", sender: "lead", timestamp: "10:20" },
    ],
  },
];

export const appointments: Appointment[] = [
  { id: "a1", leadName: "Fernanda Lima", procedure: "Botox", date: "2026-02-17", time: "09:00", duration: 60 },
  { id: "a2", leadName: "João Pedro Oliveira", procedure: "Peeling Químico", date: "2026-02-17", time: "10:30", duration: 45 },
  { id: "a3", leadName: "Beatriz Rodrigues", procedure: "Preenchimento Labial", date: "2026-02-17", time: "14:00", duration: 60 },
  { id: "a4", leadName: "Isabela Teixeira", procedure: "Botox", date: "2026-02-18", time: "09:00", duration: 60 },
  { id: "a5", leadName: "Ana Paula Silva", procedure: "Botox", date: "2026-02-18", time: "11:00", duration: 60 },
  { id: "a6", leadName: "Carlos Eduardo Santos", procedure: "Preenchimento Labial", date: "2026-02-19", time: "10:00", duration: 90 },
  { id: "a7", leadName: "Mariana Costa", procedure: "Harmonização Facial", date: "2026-02-19", time: "14:00", duration: 120 },
  { id: "a8", leadName: "Diego Mendes", procedure: "Peeling Químico", date: "2026-02-20", time: "09:00", duration: 45 },
  { id: "a9", leadName: "Fernanda Lima", procedure: "Retorno Botox", date: "2026-02-20", time: "15:00", duration: 30 },
  { id: "a10", leadName: "Lucas Ferreira", procedure: "Harmonização Facial", date: "2026-02-21", time: "10:00", duration: 120 },
  { id: "a11", leadName: "Juliana Martins", procedure: "Botox", date: "2026-02-16", time: "09:00", duration: 60 },
  { id: "a12", leadName: "Rafael Souza", procedure: "Limpeza de Pele", date: "2026-02-16", time: "11:00", duration: 45 },
  { id: "a13", leadName: "Gustavo Cardoso", procedure: "Harmonização Facial", date: "2026-02-23", time: "14:00", duration: 120 },
  { id: "a14", leadName: "Patrícia Gomes", procedure: "Preenchimento Labial", date: "2026-02-24", time: "10:00", duration: 60 },
  { id: "a15", leadName: "Thiago Barbosa", procedure: "Retorno Botox", date: "2026-02-25", time: "16:00", duration: 30 },
];

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

// Dashboard metrics
export const dashboardMetrics = {
  investment: 12500,
  totalSales: 8,
  revenue: 42000,
  roi: 236,
};

export const funnelData = [
  { stage: "Leads", value: 16, fill: "#3B82F6" },
  { stage: "Agendados", value: 7, fill: "#6366F1" },
  { stage: "Compareceram", value: 5, fill: "#8B5CF6" },
  { stage: "Fechados", value: 3, fill: "#22C55E" },
];

export const sourceData = [
  { name: "Meta Ads", value: 10, fill: "#3B82F6" },
  { name: "Site", value: 6, fill: "#6366F1" },
];

export const conversionData = [
  { name: "Agendamento", value: 43.75 },
  { name: "Comparecimento", value: 71.43 },
  { name: "Venda", value: 60.0 },
];

// Meta Ads types
export interface MetaCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
  cpc: number;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaignId: string;
  audience: string;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
}

export interface MetaAd {
  id: string;
  name: string;
  adsetId: string;
  creative: string;
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
  { id: "c1", name: "Botox Zona Sul", status: "ACTIVE", spend: 4200, impressions: 85000, clicks: 2380, leads: 42, cpl: 100, ctr: 2.8, cpc: 1.76 },
  { id: "c2", name: "Harmonização Facial", status: "ACTIVE", spend: 3800, impressions: 72000, clicks: 1944, leads: 31, cpl: 122.58, ctr: 2.7, cpc: 1.95 },
  { id: "c3", name: "Preenchimento Labial", status: "ACTIVE", spend: 2900, impressions: 58000, clicks: 1566, leads: 24, cpl: 120.83, ctr: 2.7, cpc: 1.85 },
  { id: "c4", name: "Institucional", status: "PAUSED", spend: 1600, impressions: 45000, clicks: 990, leads: 9, cpl: 177.78, ctr: 2.2, cpc: 1.62 },
];

export const metaAdSets: MetaAdSet[] = [
  { id: "as1", name: "Mulheres 25-45 SP Capital", campaignId: "c1", audience: "Mulheres 25-45 SP Capital", spend: 2800, leads: 28, impressions: 56000, clicks: 1568 },
  { id: "as2", name: "Interesse Estética 30-50", campaignId: "c1", audience: "Interesse Estética 30-50", spend: 1400, leads: 14, impressions: 29000, clicks: 812 },
  { id: "as3", name: "Lookalike Clientes 1%", campaignId: "c2", audience: "Lookalike Clientes 1%", spend: 2100, leads: 19, impressions: 40000, clicks: 1080 },
  { id: "as4", name: "Mulheres 25-35 Zona Sul", campaignId: "c2", audience: "Mulheres 25-35 Zona Sul", spend: 1700, leads: 12, impressions: 32000, clicks: 864 },
  { id: "as5", name: "Retargeting Site 30d", campaignId: "c3", audience: "Retargeting Site 30d", spend: 1600, leads: 16, impressions: 28000, clicks: 896 },
  { id: "as6", name: "Interesse Beleza 20-40", campaignId: "c3", audience: "Interesse Beleza 20-40", spend: 1300, leads: 8, impressions: 30000, clicks: 670 },
];

export const metaAds: MetaAd[] = [
  { id: "ad1", name: "Vídeo Antes/Depois Botox", adsetId: "as1", creative: "Vídeo Antes/Depois Botox", spend: 1500, leads: 16, impressions: 30000, clicks: 840, cpl: 93.75 },
  { id: "ad2", name: "Carrossel Harmonização", adsetId: "as3", creative: "Carrossel Harmonização", spend: 1200, leads: 12, impressions: 24000, clicks: 648, cpl: 100 },
  { id: "ad3", name: "Story Depoimento Paciente", adsetId: "as1", creative: "Story Depoimento Paciente", spend: 1300, leads: 12, impressions: 26000, clicks: 728, cpl: 108.33 },
  { id: "ad4", name: "Reels Procedimento Ao Vivo", adsetId: "as3", creative: "Reels Procedimento Ao Vivo", spend: 900, leads: 7, impressions: 16000, clicks: 432, cpl: 128.57 },
  { id: "ad5", name: "Imagem Promo Preenchimento", adsetId: "as5", creative: "Imagem Promo Preenchimento", spend: 950, leads: 10, impressions: 16000, clicks: 528, cpl: 95 },
  { id: "ad6", name: "Vídeo Dra. Renata Explica", adsetId: "as2", creative: "Vídeo Dra. Renata Explica", spend: 800, leads: 9, impressions: 17000, clicks: 476, cpl: 88.89 },
  { id: "ad7", name: "Carrossel Antes/Depois Lábios", adsetId: "as5", creative: "Carrossel Antes/Depois Lábios", spend: 650, leads: 6, impressions: 12000, clicks: 368, cpl: 108.33 },
  { id: "ad8", name: "Story Bastidores Clínica", adsetId: "as4", creative: "Story Bastidores Clínica", spend: 700, leads: 5, impressions: 14000, clicks: 378, cpl: 140 },
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
