# Migração da API: OpenAI GPT-4o Mini → Anthropic Claude Sonnet 4.6

## Contexto

O agente Florêncio (workflow `CLAUDE | ATENDIMENTO WPP` no N8N) atualmente usa o **GPT-4o Mini** da OpenAI para processar mensagens e gerar respostas no WhatsApp.

A migração para o **Claude Sonnet 4.6** da Anthropic traz melhor capacidade de seguir prompts longos e complexos — relevante dado o tamanho e a complexidade do `systemPrompt` do Florêncio.

**Custo comparativo:**

| Modelo | Input | Output |
|---|---|---|
| GPT-4o Mini (atual) | $0,15 / 1M tokens | $0,60 / 1M tokens |
| Claude Sonnet 4.6 | $3,00 / 1M tokens | $15,00 / 1M tokens |

O custo por atendimento completo (~15 mensagens) no Sonnet 4.6 é de aproximadamente $0,05 — ainda baixo para o volume esperado.

---

## O que muda

Apenas o workflow `CLAUDE | ATENDIMENTO WPP` no N8N. Três nós precisam ser ajustados. Banco de dados, webhooks, Z-API, Google Calendar e todos os outros workflows ficam intocados.

---

## Passo 1 — Nó `Montar Prompt`: ajustar o payload

### Onde
Workflow `CLAUDE | ATENDIMENTO WPP` → nó **Montar Prompt** (Code Node).

### Por que
A API da Anthropic usa um formato diferente da OpenAI. O campo `system` fica fora do array `messages`, separado.

### O que muda no código

**Antes (formato OpenAI):**
```js
openai_payload: {
  model: "gpt-4o-mini",
  temperature: 0.5,
  frequency_penalty: 0.3,
  max_tokens: 450,
  messages: [
    { role: "system", content: systemPrompt },
    ...formattedHistory,
    { role: "user", content: parentData.message }
  ]
}
```

**Depois (formato Anthropic):**
```js
claude_payload: {
  model: "claude-sonnet-4-6",
  max_tokens: 450,
  system: systemPrompt,
  messages: [
    ...formattedHistory,
    { role: "user", content: parentData.message }
  ]
}
```

### O que remover
- `temperature: 0.5` — a Anthropic aceita `temperature` mas o padrão já é adequado
- `frequency_penalty: 0.3` — parâmetro exclusivo da OpenAI, não existe na Anthropic

### No `return` final, renomear o campo:
```js
// Antes
openai_payload: { ... }

// Depois
claude_payload: { ... }
```

---

## Passo 2 — Nó `ChatGPT`: substituir por HTTP Request

### Onde
Workflow `CLAUDE | ATENDIMENTO WPP` → nó **ChatGPT**.

### Por que
O nó atual é do tipo OpenAI (integração nativa do N8N com a OpenAI). A Anthropic não tem nó nativo no N8N — a chamada é feita via **HTTP Request**.

### O que fazer
1. Deletar o nó `ChatGPT`
2. Criar um novo nó do tipo **HTTP Request** com as seguintes configurações:

| Campo | Valor |
|---|---|
| Method | POST |
| URL | `https://api.anthropic.com/v1/messages` |
| Header: `x-api-key` | `SUA_ANTHROPIC_API_KEY` |
| Header: `anthropic-version` | `2023-06-01` |
| Header: `content-type` | `application/json` |
| Body | `={{ JSON.stringify($json.claude_payload) }}` |

### Como obter a API Key

**Observação importante:** a conta do Claude Code (assinatura mensal) e a API são cobradas separadamente — mas usam a mesma conta Anthropic.

1. Acesse [console.anthropic.com](https://console.anthropic.com) com a mesma conta do Claude Code
2. No menu lateral, vá em **Billing** → **Add Credits** e adicione créditos (mínimo $5) — a API é pré-paga, você consome conforme o uso
3. No menu lateral, vá em **API Keys** → **Create Key**
4. Dê um nome para a chave (ex: `floren-n8n`)
5. Copie a chave gerada — ela aparece **apenas uma vez**
6. Cole no campo `x-api-key` do nó HTTP Request no N8N

**O modelo** (`claude-sonnet-4-6`) não é escolhido no console — é definido diretamente no payload do `Montar Prompt` conforme documentado no Passo 1.

---

## Passo 3 — Nó `Extrair Intenção`: ajustar extração da resposta

### Onde
Workflow `CLAUDE | ATENDIMENTO WPP` → nó **Extrair Intenção** (Code Node).

### Por que
O formato da resposta da Anthropic é diferente da OpenAI. A resposta do modelo fica em um caminho diferente no JSON retornado.

### O que muda

**Antes (formato OpenAI):**
```js
const aiResponse = $input.first().json.choices?.[0]?.message?.content || '';
```

**Depois (formato Anthropic):**
```js
const aiResponse = $input.first().json.content?.[0]?.text || '';
```

---

## Ordem de execução da migração

```
1. Gerar API Key na Anthropic (console.anthropic.com)
2. Ajustar nó Montar Prompt (formato do payload)
3. Substituir nó ChatGPT por HTTP Request com credenciais Anthropic
4. Ajustar nó Extrair Intenção (extração da resposta)
5. Testar com contato de teste no WhatsApp
6. Validar fluxo completo: atendimento → agendamento → confirmação
```

---

## Rollback

Se algo der errado, reverter os 3 nós para os valores originais documentados acima. O banco de dados não é afetado pela migração.
