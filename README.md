# AIOS

Sistema operacional de IA — MVP para ler transcrições de calls, gerar relatórios e propostas comerciais.

> **Configurando este projeto pela primeira vez (ou retomando uma instalação)?**
> Comece por **[`configuracao.md`](./configuracao.md)** (playbook fixo, faz parte do template).
>
> Em seguida, crie seu **estado local** de instalação a partir do exemplo:
>
> ```bash
> cp configuracao-estado-example.md configuracao-estado.md
> ```
>
> O `configuracao-estado.md` é **gitignored** — cada cliente mantém o próprio progresso, decisões e histórico sem interferir nas atualizações futuras do template.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Auth + Postgres)
- Zod (validação)
- **Vercel** para deploy contínuo (auto a cada push) — `docker/Dockerfile` incluso como opção de self-host (Vercel ignora)

## Arquitetura do backend

```
HTTP (Route Handler)  →  Service  →  Repository  →  Supabase
        ↑
   Proxy/Middleware (Auth via cookie Supabase)
```

Estrutura:
```
src/
  app/
    (auth)/         páginas de login, cadastro, sair
    (app)/          páginas protegidas (dashboard)
    api/            route handlers
  lib/
    config/         validação de env vars
    supabase/       clients server/browser/middleware
    auth/           requireUser helper
    errors/         AppError + helper HTTP
    validators/     schemas Zod por entidade
    repositories/   acesso ao banco por entidade
    services/       regras de negócio por entidade
    types/          tipos do banco e de domínio
  proxy.ts          proxy global (refresh de sessão + proteção de rotas)
supabase/
  migrations/       SQL inicial
docker/             Dockerfile
```

## Setup local

1. Copie env vars:
   ```bash
   cp .env.example .env.local
   ```
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do seu projeto Supabase (Dashboard → Project Settings → API).
3. Aplique a migration no Supabase (via SQL Editor do Dashboard, ou Supabase CLI):
   ```bash
   # via SQL Editor: cole o conteúdo de supabase/migrations/0001_init.sql
   ```
4. Instale e rode:
   ```bash
   npm install
   npm run dev
   ```
5. Acesse http://localhost:3000

## Deploy na Vercel

Resumo (passo a passo detalhado em `configuracao.md` → Estágio 3):

1. **Fork** este repo na sua conta GitHub.
2. **Vercel → Add New… → Project** → importar o fork.
3. **Framework Preset:** Next.js (detectado automaticamente).
4. **Environment Variables** (aplicar em Production + Preview + Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key — `sb_publishable_*` ou a legada `anon`)
   - `SUPABASE_SERVICE_ROLE_KEY` *(opcional, sensitive)*
5. **Deploy.** A partir daqui, cada push no branch principal do fork gera deploy automático.

Após o primeiro deploy, adicione `https://<projeto>.vercel.app/api/auth/callback` em **Supabase → Authentication → URL Configuration → Redirect URLs**.

> **Dockerfile incluso (`docker/Dockerfile`)** é só pra self-host opcional — a Vercel usa o runtime nativo do Next.js e ignora.

## Dados gerados pela IA por chamada

Para cada chamada que entra no AIOS (transcrição colada manualmente no MVP), a IA produz dois artefatos com **campos narrativos** + **KPIs estruturados** lado a lado. Os KPIs permitem listagens, filtros, agregações e dashboards futuros.

### Relatório de análise da call (`relatorios`)

| Campo | Tipo | O que é |
|---|---|---|
| `conteudo` | text (markdown) | Análise narrativa completa da call — fonte de verdade longa |
| `resumo_executivo` | text | Síntese de 3-5 linhas pro vendedor reler rápido |
| `sentimento` | `positivo` / `neutro` / `negativo` | Termômetro geral da conversa |
| `dores_identificadas` | jsonb (array) | Pain points levantados pelo prospect |
| `objecoes` | jsonb (array) | Resistências/dúvidas que apareceram |
| `bant_budget` | text | Orçamento — "tem? Quanto?" |
| `bant_autoridade` | text | "É o decisor? Quem mais decide?" |
| `bant_necessidade` | text | Dor real e urgência |
| `bant_prazo` | text | Quando precisa estar implementado |
| `proximos_passos` | jsonb (array) | Ações combinadas ao fim da call (com datas) |
| `probabilidade_fechamento` | smallint (0-100) | Score estimado de conversão |
| `valor_estimado_brl` | numeric(12,2) | Ticket potencial estimado do deal |
| `gerado_em` | timestamptz | Quando o relatório foi gerado |

### Proposta comercial (`propostas`)

| Campo | Tipo | O que é |
|---|---|---|
| `link_externo` | text | URL da proposta hospedada (PDF, página de assinatura, etc.) |
| `titulo` | text | Ex: "Proposta de implementação AIOS — Acme" |
| `resumo_solucao` | text | O que está sendo entregue, em prosa curta |
| `escopo` | jsonb (array) | Lista estruturada de entregáveis/módulos |
| `valor_total` | numeric(12,2) | Valor total da proposta |
| `moeda` | text (default `BRL`) | Código ISO 4217 da moeda |
| `condicoes_pagamento` | text | Ex: "30/60/90" ou "50% entrada + 50% entrega" |
| `prazo_entrega_dias` | smallint | Quantos dias úteis até a entrega |
| `validade_dias` | smallint (default 30) | Validade comercial da proposta |
| `enviada_em` | timestamptz | Quando foi enviada (null = ainda rascunho) |
| `versao` | smallint (default 1) | Iteração — útil em negociações que viram v2, v3... |
| `status` | enum (check) | `rascunho` / `enviada` / `em_negociacao` / `aceita` / `rejeitada` / `expirada` |
| `created_at` | timestamptz | Quando a proposta foi criada |

> Todos os campos exceto `chamada_id` e `link_externo` (e os defaults) são **nullable**. A IA preenche só o que conseguiu extrair sem quebrar o insert — campos não preenchidos sinalizam que aquela informação faltou na call e podem virar follow-up.

## API

Todas as rotas exigem sessão Supabase válida (cookie). Erro padrão: `{ error: { code, message, details? } }`.

| Método | Rota                       | Descrição                          |
|--------|----------------------------|------------------------------------|
| GET    | `/api/chamadas`            | lista chamadas do usuário          |
| POST   | `/api/chamadas`            | cria chamada                       |
| GET    | `/api/chamadas/[id]`       | retorna chamada                    |
| PATCH  | `/api/chamadas/[id]`       | atualiza chamada                   |
| DELETE | `/api/chamadas/[id]`       | remove chamada (cascade)           |
| GET    | `/api/transcricoes?chamada_id=...` | lista transcrições        |
| POST   | `/api/transcricoes`        | cria transcrição                   |
| ...    | (mesmo padrão)             | relatórios, propostas              |

## TODOs (próximas iterações)

- [ ] Geração de relatório por IA a partir da transcrição (`src/lib/services/relatorios.service.ts`)
- [ ] Geração de proposta + link externo (`src/lib/services/propostas.service.ts`)
- [ ] UI para listar e criar entidades via dashboard
- [ ] Testes automatizados (unit + integration)

## Spec e plano

- Spec: `docs/superpowers/specs/2026-05-12-aios-design.md`
- Plano: `docs/superpowers/plans/2026-05-13-aios-scaffold.md`