# Plano — Dashboard de Analytics (Meta Ads + CRM)

## Objetivo

Criar uma página `/analytics` que cruza dados de campanhas da Meta Ads com dados do CRM (agendamentos, comparecimentos, vendas) para exibir métricas unificadas como ROI, faturamento, CAC e taxas de conversão por etapa do funil.

---

## Contexto técnico

- Projeto: Next.js 14 App Router em `/Users/gabrielmarques/clinic-crm`
- Banco: Supabase (PostgreSQL) — já integrado via `src/lib/api.ts`
- As tabelas `meta_campaigns`, `meta_adsets` e `meta_daily_metrics` **já existem no schema**
- Pacientes já têm campos `utm_campaign`, `utm_adset`, `utm_ad` — base para cruzamento
- Tabela `patient_procedures` tem campo `value` — base para cálculo de faturamento
- Meta Ads API: rota existente em `/api/meta-ads/route.ts` com cache em arquivo (30 min)
- N8N já integrado (workflow "CLAUDE | ATENDIMENTO WPP") — pode hospedar o sync automático

---

## Problema atual

O token da Meta expira em horas/dias porque é um **User Access Token**. Toda vez que expira, o dashboard fica sem dados até renovar manualmente.

---

## Solução

### Arquitetura alvo

```
Job automático (N8N, a cada 1h) → Meta API → salva no Supabase
                                                      ↓
Usuário abre /analytics → lê do Supabase → exibe instantaneamente
                                + botão "Atualizar agora" para sync manual
```

---

## Etapas

### Etapa 1 — Token permanente (FAZER MANUALMENTE NA META) ✅ pendente

**System User Access Token** — nunca expira. Padrão de produção para integrações.

1. Acessar [business.facebook.com](https://business.facebook.com) → conta da Floren
2. Configurações → Usuários → Usuários do Sistema → "Adicionar"
   - Nome: `CRM Integration`
   - Função: Administrador
3. "Atribuir ativos" → Contas de anúncios → selecionar conta da Floren → permissão Anunciante
4. No usuário criado → "Gerar novo token"
   - App: o app já criado no Meta Developer
   - Validade: **Nunca expira**
   - Permissões: `ads_read`, `ads_management`, `read_insights`
5. Copiar o token (aparece só uma vez)
6. Atualizar `.env.local` com o novo token

---

### Etapa 2 — Sync Meta → Supabase (implementação Claude)

- Criar rota `/api/sync-meta-ads` que:
  - Busca dados de campanhas, adsets e métricas diárias da Meta API
  - Salva/atualiza nas tabelas `meta_campaigns`, `meta_adsets`, `meta_daily_metrics`
  - Suporta range de datas personalizado
  - Retorna timestamp de última atualização
- Criar workflow N8N com cron a cada 1h chamando essa rota
- Adicionar botão "Atualizar agora" no dashboard que dispara o sync manualmente

---

### Etapa 3 — Página /analytics (implementação Claude)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Filtros: [Período personalizado] [Campanha] [Público]  │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Invest.  │  Leads   │   CPL    │   ROI    │ Faturamento │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│          Funil de Conversão (por campanha)              │
│  Leads → Agendados → Compareceram → Fechados            │
├────────────────────────┬────────────────────────────────┤
│  Tabela de Campanhas   │  Gráfico Investimento vs ROI   │
│  (com todas métricas)  │  (por semana/mês)              │
└────────────────────────┴────────────────────────────────┘
```

**Métricas calculadas (Meta + CRM cruzado por UTM):**

| Métrica | Cálculo |
|---------|---------|
| Faturamento | `SUM(patient_procedures.value)` onde `utm_campaign` bate com campanha |
| ROI | `(Faturamento - Investimento) / Investimento × 100` |
| Taxa Lead→Agendamento | `COUNT(status=agendado) / total_leads_meta` |
| Taxa Agendamento→Comparecimento | `COUNT(status=compareceu) / COUNT(status=agendado)` |
| Taxa Comparecimento→Venda | `COUNT(status=fechado) / COUNT(status=compareceu)` |
| CAC | `Investimento / COUNT(status=fechado)` |
| Ticket Médio | `AVG(patient_procedures.value)` |

---

## Observações importantes

- Dados da Meta têm delay natural de 1-3h da própria plataforma (limitação deles, não do sistema)
- O sync automático garante dados com no máximo 1h de defasagem sem ação do usuário
- Filtros de data funcionam instantaneamente pois os dados estão no banco local
- Padrão visual do projeto: cards brancos `rounded-xl shadow-sm border border-gray-100`, botão primário gradiente azul `from-blue-500 to-blue-600`

---

## Status

- [ ] Etapa 1 — System User Token (pendente — fazer manualmente)
- [ ] Etapa 2 — Sync Meta → Supabase
- [ ] Etapa 3 — Página /analytics
