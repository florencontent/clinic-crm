# Floren Manage — Visão Geral do Sistema

CRM de vendas especializado para clínicas odontológicas/médicas, construído para a **Floren Odonto**.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript 5 |
| Estilização | Tailwind CSS 3.4.1, Radix UI |
| Gráficos | Recharts 3.7.0 |
| Drag & Drop | @hello-pangea/dnd |
| Ícones | Lucide React |
| Banco de Dados | Supabase (PostgreSQL) |
| ORM | Prisma 6.19.2 |
| WhatsApp | Z-API |
| Automação | N8N |
| Anúncios | Meta Graph API v21.0 |
| AI | Anthropic SDK (Claude) |

---

## Arquitetura de Pastas

```
clinic-crm/
├── src/
│   ├── app/                    # Rotas (App Router)
│   │   ├── kanban/             # Pipeline de vendas
│   │   ├── dashboard/          # Métricas e analytics
│   │   ├── conversas/          # Chat WhatsApp
│   │   ├── agenda/             # Calendário de consultas
│   │   ├── meta-ads/           # Dashboard campanhas Meta Ads
│   │   ├── follow-up/          # Automação de follow-up
│   │   ├── configuracoes/      # Configurações (geral, agenda, mensagens, notificações, tickets)
│   │   ├── login/              # Autenticação
│   │   └── api/                # API Routes (backend)
│   │       ├── doctors/
│   │       ├── procedures/
│   │       ├── specialties/
│   │       ├── messages/send/
│   │       ├── meta-ads/
│   │       └── reminder-status/
│   ├── components/             # 41 componentes React
│   │   ├── kanban/             # 9 componentes
│   │   ├── dashboard/          # 6 componentes
│   │   ├── agenda/             # 6 componentes
│   │   ├── conversas/          # 3 componentes
│   │   ├── meta-ads/           # 5 componentes
│   │   ├── layout/             # app-shell, sidebar
│   │   ├── shared/             # deal-value-field
│   │   └── ui/                 # Button, Input, Card, Avatar, Badge, ...
│   ├── lib/                    # Lógica compartilhada
│   │   ├── api.ts              # CORE — toda lógica de negócio (29KB)
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── auth-context.tsx    # Autenticação
│   │   ├── doctors-context.tsx # Contexto médicos
│   │   ├── theme-context.tsx   # Dark/Light mode
│   │   ├── language-context.tsx# Idioma (pt/en)
│   │   ├── i18n.ts             # Dicionários de tradução (11KB)
│   │   └── utils.ts            # cn() — clsx + tailwind-merge
│   ├── hooks/                  # Hooks customizados
│   │   ├── use-supabase-data.ts# usePatients, useConversations, useAppointments, useDashboardData
│   │   ├── use-doctors.ts
│   │   ├── use-procedures.ts
│   │   ├── use-specialties.ts
│   │   ├── use-tag-options.ts
│   │   └── use-meta-ads-filters.ts
│   ├── data/
│   │   └── mock-data.ts        # Tipos TypeScript principais
│   └── generated/
│       └── prisma/             # Tipos Prisma gerados
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── migrations/             # Histórico de migrations
├── docs/                       # Documentos do projeto
└── public/
    ├── renders/
    └── uploads/
```

---

## Páginas e Funcionalidades

### Kanban — Pipeline de Vendas
**Rota:** `/kanban`

Interface principal de gestão de leads com drag & drop.

**Colunas:**
- Em Contato → Agendado → Compareceu → Fechado → Perdido

**Funcionalidades:**
- Drag & drop entre colunas (atualiza status no banco em tempo real)
- Filtros por origem (Meta Ads, Site, Orgânico, Indicação)
- Busca por nome do lead
- Cards com: nome, telefone, procedimento, data, tags, status de lembrete
- Ações: novo lead, editar, agendar, marcar como perdido, reativar
- Importar/exportar CSV
- Contador de leads por coluna
- Modal de detalhes com chat integrado

---

### Dashboard — Métricas e Analytics
**Rota:** `/dashboard`

Painel de controle com métricas de conversão e receita.

**Filtros de período:** 7 dias / 14 dias / 30 dias / Máximo / Personalizado

**Cards de métricas:** Total leads, Agendados, Compareceram, Fechados, Follow-up, Perdidos, Receita

**Gráficos:**
- Funil de conversão (Leads → Follow-up → Agendados → Compareceram → Fechados)
- Origem dos leads (pie chart: Meta Ads, Site, Orgânico, Indicação)
- Breakdowns de origem por agendamentos e vendas
- Taxa de conversão por etapa
- Receita diária (últimos 30 dias — line chart)

**Comparação** com período anterior em todos os cards.

---

### Conversas — Chat WhatsApp
**Rota:** `/conversas`

Interface de chat para gerenciar conversas com leads.

**Lista de conversas:**
- Ordenação por última mensagem
- Contador de não lidas
- Pin/unpin de contatos
- Busca por nome

**Chat window:**
- Histórico de mensagens (inbound/outbound)
- Envio via Z-API
- Identificação de remetente: paciente, IA, humano

**Sidebar do lead:**
- Informações: nome, telefone, email, data de criação
- Status atual e tags
- Notas
- Próximas consultas
- Toggle: pausar/retomar agente IA
- Link para ver no Kanban

---

### Agenda — Calendário de Consultas
**Rota:** `/agenda`

Gerenciamento de agendamentos com 4 modos de visualização.

**Modos:** Dia / Semana / Mês / Ano

**Métricas no topo:** Total consultas no período, comparecimentos

**Funcionalidades:**
- Criação e edição de agendamentos (data, hora, doutor, procedimento, duração)
- Deletar agendamento
- Sincronização com Google Calendar via N8N
- Trigger automático de lembretes (D-2, D-1, dia)

---

### Meta Ads — Dashboard de Campanhas
**Rota:** `/meta-ads`

Dashboard integrado com Meta Graph API.

**Filtros de período:** 7d / 14d / 30d / Máximo / Personalizado

**Cards de overview:** Gasto total, Leads, CTR, CPC, CPL, CPM, Reach, Campanhas ativas

**Tabs:**
- **Campanhas:** gasto, impressões, cliques, leads, CPL, CPM por campanha
- **Públicos (Adsets):** audiências com métricas, frequência
- **Anúncios:** criativos com thumbnails, CPL, engagement

**Extras:**
- Gráfico de spend diário
- Breakdowns demográficos (idade, gênero)
- Origem dos leads (WhatsApp vs Site/Pixel)
- Cache de 30 min com fallback se API cair
- Retry logic com backoff exponencial

---

### Follow-up — Automação de Reativação
**Rota:** `/follow-up`

Controle da sequência de follow-up automático via N8N + WhatsApp.

**5 estágios:**
1. Interesse + especialidade
2. Benefícios + objeções
3. Prova social + educação
4. Depoimento emocional
5. Encerramento

**Tabela:**
- Busca e filtro por estágio
- Dados: nome, telefone, procedimento, origem, estágio, último envio, próximo envio
- Indicador visual de atrasos (vermelho)
- Status "Pausado" para agentes desativados

---

### Configurações
**Rota:** `/configuracoes/*`

| Sub-rota | Status | Funcionalidade |
|----------|--------|----------------|
| `/geral` | Ativo | Toggle dark/light, seleção idioma (pt/en) |
| `/tickets` | Ativo | CRUD de especialidades, procedimentos, doutores |
| `/agenda` | Em breve | Horários, dias de folga, duração padrão |
| `/mensagens` | Em breve | Templates de mensagens |
| `/notificacoes` | Em breve | Alertas por email e push |

---

## API Routes

### `POST /api/messages/send`
Envia mensagem WhatsApp via Z-API.

```json
// Input
{
  "conversationId": "string",
  "content": "string",
  "phone": "string",
  "patientId": "string"
}
```

Fluxo: Envia via Z-API → persiste no Supabase → atualiza `last_message_at`

---

### `GET /api/meta-ads`
Fetch completo de dados Meta Ads com cache de 30 minutos.

**Query params:** `date_preset`, `since`, `until`

Retorna campanhas, adsets, ads, métricas diárias, demographics, lead origins.

---

### `GET|POST|PUT|DELETE /api/doctors`
CRUD completo para doutores.

### `GET|POST|DELETE /api/procedures`
CRUD para procedimentos.

### `GET|POST|DELETE /api/specialties`
CRUD para especialidades.

### `POST /api/reminder-status`
Webhook chamado por sistemas externos para atualizar status de lembretes.

```json
// Input
{
  "phone": "string",
  "reminder_status": "aguardando" | "d2" | "d1" | "dia"
}
```

Normaliza variações de formato de telefone (55, +55, etc).

---

## Banco de Dados (Supabase / PostgreSQL)

### Enums Principais

```
PatientStatus:   novo | em_contato | qualificado | agendado | confirmado | compareceu | fechado | perdido
AppointmentStatus: agendado | confirmado | compareceu | nao_compareceu | cancelado | remarcado
MessageSender:   patient | ai | human
ReminderStatus:  pending | sent | failed
FollowUpStatus:  pending | sent | replied | cancelled
```

### Tabelas Principais

#### `patients`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| name | String? | Nome do paciente |
| phone | String @unique | Telefone |
| email | String? | Email |
| status | PatientStatus | Status no pipeline |
| source | String? | Origem: meta_ads, site, indicacao, organico |
| utm_campaign | String? | Rastreamento de campanha |
| utm_adset | String? | Rastreamento de conjunto |
| utm_ad | String? | Rastreamento de anúncio |
| procedure_interest | String? | Procedimento de interesse |
| problem_description | String? | Problema descrito |
| notes | String? | Notas internas |
| lost_reason | String? | Motivo de perda |
| deal_value | Decimal? | Valor do negócio fechado |
| follow_up_stage | Int? | Estágio do follow-up (1-5) |
| agent_paused | Boolean | IA pausada? |
| reminder_status | String? | Status do lembrete (aguardando/d2/d1/dia) |
| is_pinned | Boolean | Contato fixado nas conversas |

#### `conversations`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| patient_id | UUID | FK → patients |
| channel | Channel | whatsapp \| email |
| whatsapp_thread_id | String? | ID da thread Z-API |
| is_ai_active | Boolean | IA ativa nessa conversa |
| last_message_at | DateTime | Para ordenação |

#### `messages`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| conversation_id | UUID | FK → conversations |
| direction | inbound \| outbound | |
| sender | patient \| ai \| human | |
| content | String? | Texto |
| media_url | String? | Mídia |
| whatsapp_message_id | String? | ID externo |
| status | sent \| delivered \| read \| failed | |

#### `appointments`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| patient_id | UUID | FK → patients |
| doctor_id | UUID? | FK → doctors |
| procedure_id | UUID? | FK → procedures |
| google_event_id | String? | ID Google Calendar |
| date | Date | Data da consulta |
| start_time | Time | Horário início |
| end_time | Time | Horário fim |
| status | AppointmentStatus | |

#### `doctors`
Campos: id, name, specialty, is_active

#### `procedures`
Campos: id, name, description, price_range_min, price_range_max

#### `appointment_reminders`
Campos: id, appointment_id, type (two_days/one_day/two_hours), channel, scheduled_at, sent_at, status

#### `follow_up_messages`
Campos: id, patient_id, step (1-5), step_type, scheduled_at, sent_at, status

#### `lead_status_history`
Auditoria de mudanças de status: from_status, to_status, changed_by (ai/human/system)

#### `patient_procedures`
Procedimentos realizados: patient_id, procedure_id, appointment_id, value, status (em_tratamento/concluido/cancelado)

---

## Integrações Externas

### Supabase
- **URL:** `https://vsvhxnozikegtwxufzco.supabase.co`
- **Arquivo:** `src/lib/supabase.ts`
- Polling de 30s em todos os hooks principais

### Meta Ads (Facebook Graph API v21.0)
- **Credenciais:** `META_ADS_ACCESS_TOKEN`, `META_ADS_ACCOUNT_ID`
- Campos: spend, impressions, clicks, reach, ctr, cpc, actions (leads)
- Cache filesystem de 30 min

### Z-API (WhatsApp Gateway)
- **Instância:** `3ED9461997AF52F36B7AC638E0CE140F`
- **Endpoint usado:** `POST /send-text`
- Chamado em: `src/app/api/messages/send/route.ts`

### N8N (Automação)
**Base URL:** `https://florenmarketing.app.n8n.cloud/webhook`

| Webhook | Uso |
|---------|-----|
| `/crm-v2` | Envia mensagens de follow-up via WhatsApp |
| `/calendar-sync` | Cria/atualiza evento no Google Calendar |
| `/calendar-delete` | Remove evento do Google Calendar |
| `/pos-consulta` | Trigger pós consulta (Kanban board) |

### Anthropic API (Claude)
- SDK instalado: `@anthropic-ai/sdk ^0.78.0`
- `ANTHROPIC_API_KEY` presente no `.env.local`
- Integração frontend ainda não implementada

---

## Fluxos de Negócio

### 1. Ciclo do Lead no Kanban
```
Lead criado (novo)
    → Em Contato      [status: em_contato]
    → Agendado        [status: agendado, reminder_status: "aguardando"]
        → N8N dispara lembretes (D-2, D-1, dia)
    → Compareceu      [status: compareceu]
    → Fechado         [status: fechado, deal_value registrado]
    ou
    → Perdido         [status: perdido, lost_reason registrado]
```

### 2. Funil do Dashboard
```
Total Leads
    → com 1+ mensagem de follow-up
        → Agendados
            → Compareceram
                → Fechados (com receita)
```

### 3. Follow-up Automático
```
Lead entra no fluxo (follow_up_stage = 1)
    → N8N envia mensagem via WhatsApp a cada 24h
    → Incrementa stage (máx 5)
    → agent_paused = true desativa o fluxo
    → Webhook: POST /webhook/crm-v2
```

### 4. Agendamento + Google Calendar
```
Criar agendamento no CRM
    → Webhook N8N: /calendar-sync
    → N8N cria evento no Google Calendar
    → Supabase armazena google_event_id
    → Lembretes automáticos via N8N
Deletar agendamento
    → Webhook N8N: /calendar-delete (com google_event_id)
```

### 5. Conversa WhatsApp
```
Inbound:  WhatsApp → Z-API webhook → N8N → Supabase (messages)
Outbound: UI click → POST /api/messages/send → Z-API → Supabase
          sender = "clinic" | "ai"
```

---

## Variáveis de Ambiente

```env
# Anthropic
ANTHROPIC_API_KEY=

# Meta Ads
META_ADS_ACCESS_TOKEN=
META_ADS_ACCOUNT_ID=
META_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# N8N (opcionais — algumas URLs estão hardcoded no código)
NEXT_PUBLIC_N8N_CALENDAR_WEBHOOK=
NEXT_PUBLIC_N8N_CALENDAR_DELETE_WEBHOOK=
```

---

## Padrões de Código

**Estilo visual:**
- Cards: `rounded-xl shadow-sm border border-gray-100`
- Botão primário: gradiente `from-blue-500 to-blue-600`
- Layout de páginas: `div className="p-8"` com h2 + subtitle

**Dados:**
- Polling de 30s em todos os hooks de dados
- Mapeamento de status: 8 status do DB → 4 colunas do Kanban
- `src/lib/api.ts` é o único ponto de acesso ao Supabase no frontend

**Internacionalização:**
- Todo texto UI passa pela função `t()` do `useLanguage()`
- Suporte: Português (pt) e Inglês (en)

---

## O que ainda não está implementado

| Feature | Status |
|---------|--------|
| Configurações de Agenda | Em breve |
| Configurações de Mensagens | Em breve |
| Configurações de Notificações | Em breve |
| Integração Claude (Anthropic SDK) no frontend | SDK instalado, não conectado |
| Video Rendering (@remotion/renderer) | Dependência instalada, não usada |
