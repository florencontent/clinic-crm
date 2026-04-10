# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

CRM de vendas para a clínica **Floren Odonto**, especializada em implantes dentários. Documentação completa de arquitetura, banco de dados, integrações e fluxos de negócio está em `OVERVIEW.md` — leia antes de fazer alterações significativas.

## Comandos

```bash
npm run dev        # porta 3000
npm run build
npm run lint
npx prisma generate          # regenerar client após mudar schema
npx prisma migrate dev       # aplicar migrations localmente
```

## Arquitetura crítica

### Único ponto de acesso ao banco
`src/lib/api.ts` é o único arquivo que acessa o Supabase no frontend. **Não acesse `supabase` diretamente em componentes** — toda lógica de dados passa por aqui.

### Mapeamento de status (DB → Kanban)
O banco tem 9 status (`novo`, `em_contato`, `qualificado`, `agendado`, `confirmado`, `compareceu`, `fechado`, `perdido`, `nao_compareceu`) que mapeiam para 4 colunas do Kanban. Esse mapeamento está em `src/lib/api.ts` — ao criar novos status, atualize ambos.

### Hooks com polling
`src/hooks/use-supabase-data.ts` exporta `usePatients`, `useConversations`, `useAppointments`, `useDashboardData` — todos com polling de 30s. Não crie chamadas diretas ao Supabase nos componentes.

### Prisma com output customizado
O client Prisma é gerado em `src/generated/prisma/` (não no caminho padrão). Após qualquer mudança no `prisma/schema.prisma`, rodar `npx prisma generate`.

## Integrações externas

| Serviço | Uso |
|---|---|
| Supabase | Banco PostgreSQL principal |
| Z-API | Gateway WhatsApp — instância hardcoded em `src/app/api/messages/send/route.ts` |
| N8N | Webhooks em `florenmarketing.app.n8n.cloud` — follow-up, Google Calendar, lembretes |
| Meta Ads | Graph API v21.0 — cache filesystem de 30min em `src/app/api/meta-ads/` |

## Padrões de UI

- Cards: `rounded-xl shadow-sm border border-gray-100 dark:border-gray-800`
- Botão primário: gradiente `from-blue-500 to-blue-600`
- Layout de páginas: `<div className="p-8">` com `<h2>` + subtitle
- Suporte dark mode em todos os componentes
- Todo texto visível passa por `t()` do `useLanguage()` — suporte pt/en via `src/lib/i18n.ts`

## Regras de negócio importantes

- `agent_paused = true` em um paciente desativa o agente IA para aquele contato
- `reminder_status` em `patients` é atualizado via webhook externo (`POST /api/reminder-status`) — não pelo frontend
- Ao criar/deletar agendamento, chamar os webhooks N8N de calendar-sync/calendar-delete para sincronizar com Google Calendar
- `deal_value` só é registrado quando status = `fechado`
