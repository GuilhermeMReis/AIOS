# Configuração do AIOS — Playbook

> **Este é um projeto base / template.** Cada cliente que quer rodar o AIOS clona este repositório e executa este playbook (preferencialmente com uma sessão de IA assistindo). A IA usa as **credenciais Supabase** fornecidas pelo cliente para configurar auth, criar tabelas, RLS e tipos — o cliente não precisa abrir o SQL Editor.

**Use sempre junto com `configuracao-estado.md`** — esse outro arquivo registra o que já foi feito e qual o próximo passo. Uma sessão de IA retomando a instalação deve:

1. Ler `configuracao-estado.md` primeiro pra ver onde paramos.
2. Identificar o próximo item `[ ]` (não feito).
3. Executar conforme a seção correspondente neste arquivo.
4. **Marcar `[x]` em `configuracao-estado.md`** e atualizar "Próximo passo" + "Última ação".
5. Commitar a mudança (`docs(estado): <resumo>`).

---

## Credenciais a pedir ao cliente

A IA pede apenas o necessário pra cada estágio. Não pedir tudo no início — o cliente pode ainda não ter o domínio ou conta Easypanel quando começar.

### Bloco A — Supabase (necessário a partir do Estágio 1)

Peça ao cliente:

1. **Criar um projeto novo** em https://supabase.com/dashboard (se ainda não tem). Recomendar região próxima dos usuários finais (ex: `sa-east-1` São Paulo para Brasil). Nome livre — ex: `aios-<cliente>`.

2. Compartilhar com você **3 valores** do projeto. Onde achar: Supabase Dashboard → **Project Settings → API**.

   | Valor | Formato | Para que serve |
   |---|---|---|
   | **Project URL** | `https://<ref>.supabase.co` | Endpoint do projeto. Vai no `.env.local` do app. |
   | **Publishable key** | `sb_publishable_...` | Chave pública nova (substitui `anon`). Vai no `.env.local`. Segura no front. |
   | **Secret key** | `sb_secret_...` | Chave secreta nova (substitui `service_role`). **NÃO vai no front**. É com ela que a IA aplica DDL, configura RLS, regera tipos. |

   > **Sobre as chaves novas:** desde nov-2025 o Supabase usa `sb_publishable_*` e `sb_secret_*` no lugar de `anon`/`service_role` legados. Projetos criados depois dessa data só recebem as novas. Se o cliente tiver um projeto antigo com chaves legadas, elas ainda funcionam (a publishable substitui a anon 1-pra-1, a secret substitui a service_role 1-pra-1), mas **prefira as novas**.

   > **Canal seguro pra `sb_secret_*`:** essa chave dá poder total sobre o banco. O cliente nunca deve postá-la em chat público, screenshot, repositório, etc. Combinar canal cifrado (1Password share, gerenciador de senhas, mensagem direta criptografada).

3. *(Opcional, recomendado para automação total do Estágio 1)* **Personal Access Token (PAT)** do Supabase — Dashboard → **Account → Access Tokens → Generate new token**. Usado para configurar **redirect URLs do Auth provider** via Management API. Sem o PAT, esses 2 cliques ficam manuais no Dashboard; com ele, totalmente automatizado.

### Bloco B — Easypanel (necessário a partir do Estágio 3)

1. **URL do painel** — ex: `https://panel.cliente.com`.
2. **API token** — Easypanel → **Settings → API → Create token**. Permissões: criar projeto, criar service, definir env vars, deploy.
3. **Nome do projeto** desejado no painel (ex: `aios`).
4. **Repositório git** acessível ao Easypanel (URL HTTPS ou SSH). Se privado, deploy key/PAT do provider.
5. **Domínio público** — ex: `aios.cliente.com`. HTTPS automático.

### Bloco C — Provedor de IA (fora do scaffold inicial)

Anthropic API key ou OpenAI API key quando o cliente decidir habilitar geração de relatório/proposta.

---

## Estágio 1 — Supabase configurado pela IA

**Pré-requisito:** Bloco A entregue (URL + publishable + secret).

### O que a IA executa

A IA tem 3 caminhos para operar o projeto Supabase do cliente, em ordem de preferência:

**Caminho 1 — MCP do Supabase (preferido):** se a sessão tiver o MCP `claude_ai_Supabase` ativo, use as ferramentas:
- `list_projects` → confirma o `project_id` baseado na URL.
- `apply_migration` → roda o SQL.
- `list_tables` → verifica criação.
- `get_advisors` → checa segurança/performance.
- `generate_typescript_types` → regera tipos.
- `get_project_url` / `get_publishable_keys` → confirma valores fornecidos.

> Com MCP, a `sb_secret_*` é redundante — a autenticação já vem do MCP do usuário. Peça mesmo assim, porque a IA da próxima sessão (ou um operador humano) pode não ter MCP.

**Caminho 2 — psql via secret key:** sem MCP, conectar direto no banco e rodar a migration:
```bash
# o cliente fornece a secret; URL do banco é db.<ref>.supabase.co
PGPASSWORD='<sb_secret_...>' psql \
  -h db.<ref>.supabase.co -p 5432 -U postgres -d postgres \
  -f supabase/migrations/0001_init.sql
```
Atenção: a porta 5432 pode estar bloqueada em algumas redes. Alternativa: usar a porta 6543 (pooler) ou o SQL REST endpoint.

**Caminho 3 — REST `pg_meta`:** via HTTP API com a `sb_secret_*` como bearer, postar SQL em `<URL>/pg/query` (endpoint interno do Supabase). Menos comum, manter como fallback.

### Passos (executar em sequência)

1. **Validar credenciais.**
   ```bash
   curl -s "<NEXT_PUBLIC_SUPABASE_URL>/auth/v1/health" -H "apikey: <sb_publishable_...>" | head -1
   ```
   Esperado: `{"status":"OK"}` ou similar.

2. **Aplicar a migration** `supabase/migrations/0001_init.sql` pelo caminho escolhido acima.

3. **Verificar tabelas.** Confirmar que existem em `public`: `chamadas`, `transcricoes`, `relatorios`, `propostas`. Cada uma com RLS habilitado.

4. **Habilitar Email Auth.**
   - **Com PAT:** `PATCH https://api.supabase.com/v1/projects/<ref>/config/auth` com `{"external_email_enabled": true, "mailer_autoconfirm": <bool>}`.
   - **Sem PAT:** instruir o cliente: Dashboard → **Authentication → Providers → Email** → habilitar. Perguntar "Confirm email" liga ou desliga.

5. **Configurar redirect URLs do Auth.**
   - **Com PAT:** mesmo endpoint acima, campo `uri_allow_list` (lista de URIs permitidas). Adicionar `http://localhost:3000/api/auth/callback`. Mais tarde, no Estágio 4, adicionar `https://<dominio-producao>/api/auth/callback`.
   - **Sem PAT:** instruir o cliente: Dashboard → **Authentication → URL Configuration → Redirect URLs** → adicionar as duas.

6. **Regenerar tipos TypeScript.**
   - **Com MCP:** `generate_typescript_types(project_id)`.
   - **Com Supabase CLI:** `npx supabase gen types typescript --project-id <ref> > src/lib/types/database.types.ts`.
   - Commitar a mudança: `git commit -m "feat(types): regenera database.types do schema do cliente"`.

7. **Rodar advisors.**
   - **Com MCP:** `get_advisors(project_id, "security")` e `get_advisors(project_id, "performance")`.
   - Resolver quaisquer alertas críticos antes de seguir. Reportar warnings menores ao cliente.

### Decisão a confirmar com o cliente

- **"Confirm email" ligado ou desligado?**
  - Desligado (recomendado para MVP/demo): signup já loga direto.
  - Ligado (recomendado para produção): usuário precisa clicar no link do email.

### Critério de pronto
- 4 tabelas presentes com RLS ativa.
- Email Auth habilitado.
- Redirect URLs configuradas (pelo menos localhost por enquanto).
- `database.types.ts` regenerado e commitado.
- Sem alertas de segurança críticos.

---

## Estágio 2 — App rodando local

**Pré-requisito:** Estágio 1 completo.

### O que o cliente faz

1. **Receber da IA** a URL e a publishable key prontas pra colar.

2. **Criar `.env.local`:**
   ```bash
   cp .env.example .env.local
   ```
   Preencher:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<URL fornecida pela IA>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<sb_publishable_... — apesar do nome legado da variável, é a publishable nova>
   # SUPABASE_SERVICE_ROLE_KEY=<sb_secret_...>  ← só se for usar jobs admin server-side; cuidado: nunca expor no client
   ```

   > Nota: as variáveis no app mantêm os nomes `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para compatibilidade com `@supabase/ssr` — o **valor** colocado em `_ANON_KEY` agora é a publishable key nova.

3. **Instalar e rodar:**
   ```bash
   npm install
   npm run dev
   ```
   Abrir http://localhost:3000.

4. **Smoke test do fluxo:**
   - `/` → **Criar conta** → email + senha (≥6 chars).
   - Se Confirm Email ligado, confirmar no email.
   - `/dashboard` → vê `Olá, <email>`.
   - **Sair** → volta pra `/login`.

5. **Smoke test da API:**
   - Logado: http://localhost:3000/api/chamadas → `{"data":[]}`.
   - Sem cookie (curl novo) → 401 com JSON de erro.

### Critério de pronto
- Cadastro + login + dashboard + sair funcionam.
- API retorna 401 sem sessão e `{ data: [] }` com sessão.

---

## Estágio 3 — Easypanel configurado

**Pré-requisito:** Estágios 1 e 2 completos + Bloco B entregue.

### Fluxo via API (preferido quando token funciona)

> Endpoints exatos variam entre versões do Easypanel. Primeiro explorar:
> ```bash
> curl -H "Authorization: Bearer <TOKEN>" <PANEL_URL>/api/trpc/projects.listProjects
> ```
> Se 200 → API tRPC moderna. Se 404, tentar `/api/v1/...`. Se nada, fallback UI abaixo.

1. **Listar projetos** pra confirmar acesso.
2. **Criar projeto** com o nome combinado.
3. **Criar service "app":**
   - Source: git repo + branch `main`.
   - Build: Dockerfile, path `docker/Dockerfile`.
   - **Build args** (necessários pois `NEXT_PUBLIC_*` são inlineados no bundle):
     - `NEXT_PUBLIC_SUPABASE_URL=<URL>`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>`
   - **Env vars (runtime):** as mesmas + opcionalmente `SUPABASE_SERVICE_ROLE_KEY` = `<sb_secret_...>` se for usar admin server-side.
   - Porta exposta: `3000`.
   - Domínio: `<dominio-producao>` com HTTPS.

### Fluxo via UI (fallback)

1. Easypanel → **Create project** → nome combinado.
2. Dentro do projeto → **+ Service → App**.
3. **Source** → GitHub/GitLab (autorizar) → repo → branch `main`.
4. **Build** → Dockerfile → path `docker/Dockerfile`.
5. **Build Args** → adicionar os dois `NEXT_PUBLIC_*`.
6. **Environment** → mesmas vars (runtime) + opcionalmente a secret.
7. **Domains** → adicionar domínio + HTTPS.
8. **Save**.

### Critério de pronto
- Service criado com source git + Dockerfile.
- Build args + env vars setadas com a publishable key.
- Domínio mapeado.

---

## Estágio 4 — Deploy ativo

**Pré-requisito:** Estágio 3 completo.

1. **Adicionar redirect URL de produção no Supabase.**
   - Com PAT: PATCH no config/auth incluindo `https://<dominio>/api/auth/callback` em `uri_allow_list`.
   - Sem PAT: Dashboard → Authentication → URL Configuration → adicionar.

2. **Disparar deploy** no Easypanel (API ou botão **Deploy**).

3. **Acompanhar logs do build.** Falhas comuns:
   - **`NEXT_PUBLIC_*` undefined no bundle** → conferir que estão em **Build Args**, não só runtime.
   - **Typecheck** → rodar `npx tsc --noEmit` local primeiro.
   - **Migration ainda não aplicada** → voltar ao Estágio 1.

4. **Smoke test em produção.**
   - `https://<dominio>` → cadastro → confirma (se aplicável) → login → dashboard.
   - `https://<dominio>/api/chamadas` autenticado → `{ data: [] }`.

### Critério de pronto
- Build verde.
- HTTPS ativo no domínio.
- Cadastro/login/dashboard funcionam em produção.

---

## Pós-deploy

Em `configuracao-estado.md`:
- Marcar Estágio 4 como `[x]`.
- "Próximo passo" → features de IA (geração de relatório a partir da transcrição).
- Adicionar entrada no Histórico com data e URL de produção.

A partir daqui, o cliente pede ao seu time/IA o desenvolvimento das features de IA listadas na seção "Pós-deploy" de `configuracao-estado.md`.

---

## Hand-off entre sessões de IA

Se a sessão atual termina antes do Estágio 4, garanta que:

1. **`configuracao-estado.md` está commitado** com os `[x]` corretos e o "Próximo passo" descrevendo claramente o estado.
2. **Credenciais sensíveis NÃO foram commitadas** — `.env.local`, secret key, PAT. Conferir com `git status` antes de qualquer push.
3. **Decisões tomadas com o cliente** (ex: Confirm email ligado/desligado, escolha de região, domínio) foram anotadas na seção "Decisões registradas" de `configuracao-estado.md`.

A próxima sessão de IA lê `configuracao-estado.md` → identifica o próximo `[ ]` → vem a esta seção do playbook → retoma.
