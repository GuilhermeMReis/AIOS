# Estado da Configuração do AIOS

> **Atualizado em:** 2026-05-13
> **Última ação:** Estágio 1 completo. Cliente confirmou Email Auth habilitado + Confirm email desligado + Redirect URL `http://localhost:3000/api/auth/callback` adicionada no Dashboard.
> **Próximo passo:** Estágio 2 — cliente cria `.env.local`, roda `npm install` + `npm run dev`, faz smoke test de cadastro/login/dashboard/sair + smoke test da API.

> **Nota:** este arquivo registra o estado **do projeto base**. Quando um cliente clonar para instalar, ele começa com este estado (Estágio 0 = `[x]`, demais = `[ ]`) e atualiza conforme avança na própria instância.

---

## Como uma sessão de IA deve usar este arquivo

1. Ler o cabeçalho acima → entende o contexto.
2. Procurar o primeiro `[ ]` na ordem dos estágios → é o próximo passo.
3. Abrir `configuracao.md` na seção do estágio correspondente.
4. Executar. Ao concluir um item, **marcar `[x]` e atualizar o cabeçalho** ("Última ação" + "Próximo passo").
5. Adicionar entrada no **Histórico** ao final deste arquivo.
6. Commitar: `git commit -m "docs(estado): <resumo da ação>"`.

Se um passo bloquear (ex: cliente não tem credencial pronta), deixar `[ ]` mas **atualizar "Próximo passo"** explicando o bloqueio.

---

## Checklist

### Estágio 0 — Scaffold (concluído)
- [x] Spec do design (`docs/superpowers/specs/2026-05-12-aios-design.md`)
- [x] Plano de implementação (`docs/superpowers/plans/2026-05-13-aios-scaffold.md`)
- [x] Bootstrap Next.js 16 + Tailwind v4 + TypeScript
- [x] Dependências Supabase + Zod instaladas
- [x] Camada de auth (proxy + requireUser)
- [x] 4 entidades de domínio (validator + repo + service + routes)
- [x] Migration SQL com RLS
- [x] Páginas de auth (login/cadastro/sair/callback) + dashboard placeholder
- [x] Dockerfile multi-stage
- [x] README com setup e deploy
- [x] Code review final aplicado (fixes de open-redirect, DELETE 404, layout metadata)

### Estágio 1 — Supabase configurado pela IA (via MCP)
- [x] MCP `claude_ai_Supabase` ativo na sessão do cliente (`list_organizations` funciona)
- [x] Cliente decidiu: projeto existente OU criar novo (com nome + região)
- [x] Cliente decidiu: "Confirm email" ligado ou desligado (registrar em "Decisões")
- [ ] *(Opcional)* Personal Access Token (PAT) recebido pra automatizar Auth config — cliente optou por não usar
- [x] `project_id` identificado ou novo projeto criado (`ACTIVE_HEALTHY`)
- [x] Migration `0001_init.sql` aplicada via `apply_migration`
- [x] `list_tables` confirma 4 tabelas + `rowsecurity = true` em todas
- [x] Email Auth habilitado (via PAT ou cliente no Dashboard) — feito manual pelo cliente
- [x] Redirect URL `http://localhost:3000/api/auth/callback` adicionada — feito manual pelo cliente
- [x] `database.types.ts` regenerado via `generate_typescript_types` e commitado
- [x] `get_advisors` (security + performance) sem alertas críticos
- [x] URL + publishable key entregues ao cliente pro Estágio 2

### Estágio 2 — App rodando local
- [ ] `.env.local` criado e preenchido
- [ ] `npm install` executado
- [ ] `npm run dev` levanta sem erro
- [ ] Cadastro funciona via UI
- [ ] Login funciona via UI
- [ ] Dashboard exibe email do usuário logado
- [ ] Sair redireciona pra `/login`
- [ ] `GET /api/chamadas` autenticado → `{ data: [] }`
- [ ] `GET /api/chamadas` sem auth → 401 com JSON de erro

### Estágio 3 — Easypanel configurado pela IA (via API)
- [ ] Credenciais recebidas (URL do painel + API token)
- [ ] Nome do projeto, repo git e domínio definidos com cliente
- [ ] Repositório git acessível ao Easypanel (deploy key/PAT do provider configurado)
- [ ] Formato da API descoberto (tRPC moderna vs `/api/v1/*`)
- [ ] Projeto criado no painel via API
- [ ] Service "app" criado com source git + Dockerfile (`docker/Dockerfile`)
- [ ] Build Args setados (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Env vars de runtime setadas
- [ ] Porta 3000 exposta
- [ ] Domínio mapeado com HTTPS provisionado
- [ ] Configuração validada via GET no service

### Estágio 4 — Deploy ativo
- [ ] Redirect URL de produção adicionada no Supabase
- [ ] Deploy disparado
- [ ] Build concluído sem erro (logs revisados)
- [ ] HTTPS respondendo no domínio
- [ ] Cadastro funciona em produção
- [ ] Login funciona em produção
- [ ] Dashboard funciona em produção
- [ ] API `GET /api/chamadas` funciona em produção (autenticado)

### Pós-deploy — Features de IA (fora deste playbook)
- [ ] Credenciais Anthropic/OpenAI recebidas
- [ ] Geração de relatório implementada (service `relatorios`)
- [ ] Geração de proposta + link externo (service `propostas`)
- [ ] UI no dashboard pra criar chamadas + colar transcrição

---

## Decisões registradas

Anote aqui escolhas feitas com o cliente que afetam configuração:

- **2026-05-13 — Projeto Supabase:** usar projeto existente `G4-AIOS` (ref `pyenjvreoxhmasxalkiu`, org `DinastIA`, região `sa-east-1`).
- **2026-05-13 — Confirm email:** **desligado** (`mailer_autoconfirm: true`). Signup loga direto. Decisão MVP/demo; cliente pode ligar depois antes de produção real, se quiser.
- **2026-05-13 — PAT do Supabase:** não fornecido. Passos de Auth config (habilitar Email + Redirect URL) ficam manuais no Dashboard.

---

## Histórico

- **2026-05-13** — Scaffold finalizado. 23 commits em `main`. Build verde. Code review final aplicado. Aguardando credenciais do cliente para iniciar Estágio 1.
- **2026-05-13** — Playbook reformulado para projeto base/template. Estágio 1 agora prevê IA configurando auth/DDL/RLS via `sb_secret_*`; cliente entrega 2 chaves (`sb_publishable_*` + `sb_secret_*`) + URL. PAT opcional pra automação total do Auth.
- **2026-05-13** — Modelo simplificado: cliente instala MCP do Supabase no Claude (uma vez, em Settings → Connectors); IA opera via MCP tools sem precisar de chaves manuais. Easypanel continua via API HTTP. Fluxo manual de chaves vira fallback (Bloco A.1) só se MCP não funcionar.
- **2026-05-13** — Estágio 1 executado pela IA no projeto `G4-AIOS` (ref `pyenjvreoxhmasxalkiu`, `sa-east-1`): migration `init` aplicada (4 tabelas + RLS), migration `optimize_rls_auth_uid` aplicada eliminando 16 warns `auth_rls_initplan`, types regenerados e commitados, advisors sem alertas críticos (restam 4 INFO `unused_index` esperados em DB vazia + 1 INFO `auth_db_connections_absolute` pra revisar antes de prod real). Pendente: cliente habilita Email Auth + Redirect URL no Dashboard.
- **2026-05-13** — Estágio 1 fechado. Cliente confirmou no Dashboard: Email Auth habilitado, Confirm email desligado, Redirect URL `http://localhost:3000/api/auth/callback` adicionada. Pronto pra Estágio 2.
