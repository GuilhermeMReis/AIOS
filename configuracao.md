# Configuração do AIOS — Playbook

Este documento é o **playbook operacional** para levar o AIOS do scaffold (estado atual) até produção.

**Use sempre junto com `configuracao-estado.md`** — ele registra o que já foi feito e qual o próximo passo. Uma sessão de IA retomando esse trabalho deve:

1. Ler `configuracao-estado.md` primeiro pra ver onde paramos.
2. Identificar o próximo item `[ ]` (não feito).
3. Executar conforme a seção correspondente neste arquivo.
4. **Marcar `[x]` em `configuracao-estado.md`** e atualizar "Próximo passo" + "Última ação".
5. Commitar a mudança de estado (`docs(estado): ...`).

---

## Credenciais a pedir ao cliente

Antes de qualquer estágio, peça apenas o que for necessário para o próximo passo. Não junte tudo no início — o cliente pode não ter ainda.

### Bloco A — Supabase (necessário a partir do Estágio 1)

Pergunte ao cliente:

1. **Você já tem um projeto no Supabase para o AIOS?**
   - Se **não**: oriente criar em https://supabase.com/dashboard → **New project**. Escolha região próxima dos usuários finais.
   - Se **sim**: prossiga.

2. **Project URL** — formato `https://<id>.supabase.co`.
   - Onde achar: Supabase Dashboard → **Settings → API** → campo **Project URL**.

3. **anon public key** — chave pública (segura no client).
   - Onde achar: mesmo lugar → **Project API keys** → linha `anon` / `public`.

4. **service_role key** *(opcional, só se rodarmos jobs admin)* — chave admin.
   - **NUNCA expor no front.** Só usar em código server-side específico.
   - Onde achar: mesmo lugar → linha `service_role`.

5. **Project ref / ID** *(útil pra regenerar tipos)* — o subdomínio do Project URL.
   - Ex: se URL é `https://abcdefgh.supabase.co`, ref é `abcdefgh`.

### Bloco B — Easypanel (necessário a partir do Estágio 3)

1. **URL do painel** — ex: `https://panel.cliente.com`.

2. **API token** — Easypanel → **Settings → API** → **Create token**.
   - Permissões mínimas: criar projeto, criar service, definir env vars, deploy.

3. **Nome do projeto** desejado no Easypanel (ex: `aios`).

4. **Repositório git acessível ao Easypanel** — URL HTTPS ou SSH.
   - Se o repo é privado, configurar deploy key ou Git provider (GitHub/GitLab) com token.

5. **Domínio público** — ex: `aios.cliente.com`. Easypanel cuida do HTTPS automático.

### Bloco C — Provider de IA (futuro, fora do scaffold)

Anthropic API key ou OpenAI API key, quando formos habilitar geração de relatório/proposta.

---

## Estágio 1 — Supabase configurado

**Pré-requisito:** credenciais do Bloco A.

### Passos

1. **Validar credenciais.** Com URL e anon key em mãos, testar acesso:
   ```bash
   curl -s "<NEXT_PUBLIC_SUPABASE_URL>/auth/v1/health" -H "apikey: <ANON_KEY>" | head -1
   ```
   Esperado: `200 OK` ou JSON com `"status":"OK"`.

2. **Aplicar a migration.** Há duas opções:

   **Opção A — SQL Editor (mais simples, sem instalar nada):**
   - Supabase Dashboard → **SQL Editor** → **New query**.
   - Cole o conteúdo de `supabase/migrations/0001_init.sql`.
   - **Run**. Conferir que as 4 tabelas (`chamadas`, `transcricoes`, `relatorios`, `propostas`) aparecem em **Table Editor**.

   **Opção B — Supabase CLI (se o cliente prefere CLI):**
   ```bash
   npm install -D supabase
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push
   ```

3. **Habilitar Email Auth.**
   - Dashboard → **Authentication → Providers → Email** → habilitar.
   - Decisão a confirmar com o cliente: **"Confirm email" ligado ou desligado?**
     - Desligado (recomendado pra MVP/teste): signup já loga direto.
     - Ligado: usuário precisa clicar no link do email antes de logar.

4. **Configurar redirect URLs.**
   - Dashboard → **Authentication → URL Configuration**.
   - Adicionar em **Redirect URLs**:
     - `http://localhost:3000/api/auth/callback` (dev)
     - `https://<dominio-producao>/api/auth/callback` (quando souber o domínio)

5. **Regenerar tipos do banco (substitui o stub).**
   ```bash
   npx supabase gen types typescript --project-id <PROJECT_REF> > src/lib/types/database.types.ts
   ```
   Isso substitui o stub manual por tipos reais. **Commitar a mudança.**

### Critério de pronto
- Tabelas visíveis no Table Editor.
- `database.types.ts` regenerado e commitado.
- Auth provider Email ativo.

---

## Estágio 2 — App rodando local

**Pré-requisito:** Estágio 1 completo.

### Passos

1. **Criar `.env.local`:**
   ```bash
   cp .env.example .env.local
   ```
   Editar e preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Não commitar.

2. **Instalar deps (se ainda não):**
   ```bash
   npm install
   ```

3. **Subir o dev server:**
   ```bash
   npm run dev
   ```
   Abrir http://localhost:3000.

4. **Smoke test do fluxo:**
   - Página `/` → clicar em **Criar conta**.
   - Cadastrar email + senha (≥6 chars).
   - Se Confirm Email estiver ligado, confirmar no email. Se desligado, vai direto pro dashboard.
   - Em `/dashboard`, ver `Olá, <email>`.
   - Clicar em **Sair** → volta pra `/login`.

5. **Smoke test da API.** Com o navegador logado, em outra aba do mesmo browser:
   - http://localhost:3000/api/chamadas → deve retornar `{"data":[]}` (com status 200).
   - Sem cookie de sessão (curl novo) → deve retornar 401 com `{"error":{...}}`.

### Critério de pronto
- Cadastro + login + dashboard + sair funcionam.
- API retorna 401 sem sessão e `{ data: [] }` com sessão.

---

## Estágio 3 — Easypanel configurado

**Pré-requisito:** Estágios 1 e 2 completos + credenciais do Bloco B.

### Passos

> **Nota sobre a API do Easypanel:** os endpoints exatos variam entre versões. Quando o cliente fornecer URL + token, primeiro explore:
> ```bash
> curl -H "Authorization: Bearer <TOKEN>" <PANEL_URL>/api/trpc/projects.listProjects
> ```
> Se 200 → API tipo tRPC (versão moderna). Adapte as chamadas abaixo conforme a resposta. Se 404, tente `/api/v1/...`. Se nada funcionar, **caia pro fluxo via UI** documentado abaixo.

### Fluxo via API (quando disponível)

1. **Listar projetos** para confirmar acesso:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" <PANEL_URL>/api/trpc/projects.listProjects
   ```

2. **Criar projeto** (se ainda não existe):
   ```bash
   curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
     -d '{"name":"aios"}' \
     <PANEL_URL>/api/trpc/projects.createProject
   ```

3. **Criar service "app"** com:
   - Source: git repo + branch `main`
   - Build: Dockerfile, path `docker/Dockerfile`
   - Build args:
     - `NEXT_PUBLIC_SUPABASE_URL=<valor>`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<valor>`
   - Env vars (runtime, mesmo conteúdo):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (se aplicável)
   - Porta exposta: `3000`
   - Domínio: `<dominio-producao>`

### Fluxo via UI (fallback)

Se a API não funcionar ou cliente preferir, guie pelo painel:

1. Easypanel → **Create project** → nome `aios`.
2. Dentro do projeto → **+ Service → App**.
3. **Source** → **GitHub/GitLab** (autorizar se preciso) → escolher repo → branch `main`.
4. **Build** → **Dockerfile** → path `docker/Dockerfile`.
5. **Build Args** → adicionar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. **Environment** → mesmas vars (runtime).
7. **Domains** → adicionar domínio + ativar HTTPS.
8. **Save**.

### Critério de pronto
- Service criado e configurado.
- Build args + env vars setadas.
- Domínio mapeado.

---

## Estágio 4 — Deploy ativo

**Pré-requisito:** Estágio 3 completo.

### Passos

1. **Adicionar redirect URL de produção no Supabase.**
   - Dashboard Supabase → **Authentication → URL Configuration**.
   - Adicionar `https://<dominio-producao>/api/auth/callback` em **Redirect URLs**.

2. **Trigger deploy no Easypanel.**
   - Via API ou clicando em **Deploy** na UI do service.

3. **Acompanhar logs do build.** Se falhar:
   - Erro em build args inlined? → conferir que `NEXT_PUBLIC_*` estão setados como **Build Args** (não só env runtime).
   - Erro de typecheck? → rodar `npx tsc --noEmit` local primeiro.

4. **Smoke test em produção.**
   - Abrir `https://<dominio>` → cadastrar conta → confirmar (se aplicável) → login → ver dashboard.
   - `https://<dominio>/api/chamadas` autenticado → `{ data: [] }`.

### Critério de pronto
- Build verde no Easypanel.
- HTTPS ativo no domínio.
- Fluxo end-to-end funciona em produção.

---

## Pós-deploy

Atualizar `configuracao-estado.md`:
- Marcar Estágio 4 como `[x]`.
- "Próximo passo" → começar a implementar as features de IA (geração de relatório).
- Adicionar entrada no Histórico com data e URL de produção.
