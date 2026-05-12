# AIOS Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o scaffold inicial do AIOS — Next.js 15 + Supabase + Docker — com auth funcional, padrão de camadas (Route Handler → Service → Repository) e CRUD das 4 entidades de domínio (chamadas, transcrições, relatórios, propostas), pronto para receber credenciais e ir para o Easypanel.

**Architecture:** App Router do Next.js servindo páginas mínimas de auth + API routes que delegam para services e repositories. Supabase fornece auth (cookies via `@supabase/ssr`) e Postgres com RLS. Cada entidade segue o mesmo padrão de quatro arquivos (validator Zod, repository, service, route handler).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, `@supabase/ssr`, `@supabase/supabase-js`, Zod, Docker (node:20-alpine), Easypanel.

**Sobre TDD nesse plano:** o spec aprovado (`docs/superpowers/specs/2026-05-12-aios-design.md`, §12) declara explicitamente que testes automatizados estão fora do escopo desta fase. Cada task tem em vez disso um passo de **verificação manual** com comando concreto e output esperado. Quando começarmos a implementar features reais de domínio (geração de relatório, etc.), TDD volta a ser obrigatório.

**Convenção do diretório de trabalho:** todos os comandos shell assumem que você está em `"/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"`. O diretório contém espaços — sempre quote.

---

## Mapa de Arquivos

Arquivos criados por este plano (agrupados por responsabilidade):

**Bootstrap/config:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`
- `.env.example`, `.gitignore`, `.dockerignore`
- `docker/Dockerfile`
- `README.md`

**App / páginas:**
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/cadastro/page.tsx`
- `src/app/(auth)/sair/route.ts`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/api/auth/callback/route.ts`

**Infra do backend:**
- `src/middleware.ts`
- `src/lib/config/env.ts`
- `src/lib/errors/app-error.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/auth/require-user.ts`
- `src/lib/types/database.types.ts`
- `src/lib/types/entities.ts`

**Camadas por entidade (×4):** `chamadas`, `transcricoes`, `relatorios`, `propostas`
- `src/lib/validators/<entidade>.schema.ts`
- `src/lib/repositories/<entidade>.repo.ts`
- `src/lib/services/<entidade>.service.ts`
- `src/app/api/<entidade>/route.ts`
- `src/app/api/<entidade>/[id]/route.ts`

**Banco de dados:**
- `supabase/migrations/0001_init.sql`

---

## Task 1: Bootstrap do projeto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Criar projeto Next.js com TypeScript e Tailwind**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx --yes create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

Quando perguntar sobre Turbopack, aceite o padrão. Como o diretório tem `.git` e `docs/`, o create-next-app pode pedir confirmação para sobrescrever — responda **Yes** para todos. O `docs/` é preservado (não está nos templates do CNA).

Expected: comando termina com `Success! Created ...`. Diretório agora contém `package.json`, `next.config.ts`, `tsconfig.json`, pasta `src/app/`, pasta `node_modules/`.

- [ ] **Step 2: Verificar que dev server inicia**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npm run build
```

Expected: build conclui sem erros, mostra rotas estáticas (`/`) e termina com mensagem de sucesso (algo como `✓ Compiled successfully`).

- [ ] **Step 3: Ajustar `next.config.ts` para output standalone (Docker)**

Edite `next.config.ts` para que fique exatamente:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 4: Substituir `src/app/page.tsx` por um placeholder limpo**

Sobrescreva `src/app/page.tsx` com:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">AIOS</h1>
      <p className="text-gray-600">Sistema operacional de IA</p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
          Entrar
        </Link>
        <Link href="/cadastro" className="rounded border px-4 py-2">
          Criar conta
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verificar build limpo**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npm run build
```

Expected: build passa sem erros.

- [ ] **Step 6: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add -A
git commit -m "chore: bootstrap Next.js 15 + Tailwind + standalone output"
```

---

## Task 2: Instalar dependências do Supabase e Zod

**Files:**
- Modify: `package.json` (via `npm install`)

- [ ] **Step 1: Instalar pacotes**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npm install @supabase/supabase-js @supabase/ssr zod
```

Expected: comando termina com `added N packages`. Sem erros.

- [ ] **Step 2: Verificar presença em `package.json`**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
node -e "const p = require('./package.json'); console.log(Object.keys(p.dependencies))"
```

Expected: array contém `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `next`, `react`, `react-dom`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add package.json package-lock.json
git commit -m "chore: add @supabase/ssr, supabase-js e zod"
```

---

## Task 3: Validação de env vars + `.env.example`

**Files:**
- Create: `src/lib/config/env.ts`
- Create: `.env.example`
- Modify: `.gitignore` (garantir `.env*.local` ignorado — create-next-app já costuma fazer; conferir)

- [ ] **Step 1: Criar `src/lib/config/env.ts`**

```ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória",
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!parsed.success) {
  console.error(
    "Variáveis de ambiente inválidas:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Configuração de ambiente inválida — veja .env.example");
}

export const env = parsed.data;
```

- [ ] **Step 2: Criar `.env.example`**

```
# Supabase — pegue em https://supabase.com/dashboard/project/<seu-projeto>/settings/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Opcional — só para jobs admin server-side. NUNCA expor no client.
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 3: Conferir `.gitignore` ignora `.env`**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
grep -E "^\.env" .gitignore
```

Expected: aparecem linhas como `.env*.local`. Se não houver, adicione manualmente as linhas:
```
.env
.env.local
.env*.local
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/config/env.ts .env.example .gitignore
git commit -m "feat(config): validação Zod de env vars + .env.example"
```

---

## Task 4: AppError e helper de resposta HTTP

**Files:**
- Create: `src/lib/errors/app-error.ts`

- [ ] **Step 1: Criar `src/lib/errors/app-error.ts`**

```ts
import { NextResponse } from "next/server";

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: STATUS_BY_CODE[err.code] },
    );
  }

  console.error("Unhandled error:", err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Erro interno" } },
    { status: 500 },
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/errors/app-error.ts
git commit -m "feat(errors): AppError + helper de resposta HTTP"
```

---

## Task 5: Tipos do banco (stub) e tipos de domínio

**Files:**
- Create: `src/lib/types/database.types.ts`
- Create: `src/lib/types/entities.ts`

> **Nota:** este `database.types.ts` é um **stub manual**. Quando o usuário fornecer as credenciais do Supabase, regeneramos automaticamente com `supabase gen types typescript --project-id <id> > src/lib/types/database.types.ts`.

- [ ] **Step 1: Criar `src/lib/types/database.types.ts`**

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      chamadas: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string;
          status?: string;
          created_at?: string;
        };
      };
      transcricoes: {
        Row: {
          id: string;
          chamada_id: string;
          conteudo: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chamada_id: string;
          conteudo: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chamada_id?: string;
          conteudo?: string;
          created_at?: string;
        };
      };
      relatorios: {
        Row: {
          id: string;
          chamada_id: string;
          conteudo: string;
          gerado_em: string;
        };
        Insert: {
          id?: string;
          chamada_id: string;
          conteudo: string;
          gerado_em?: string;
        };
        Update: {
          id?: string;
          chamada_id?: string;
          conteudo?: string;
          gerado_em?: string;
        };
      };
      propostas: {
        Row: {
          id: string;
          chamada_id: string;
          link_externo: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chamada_id: string;
          link_externo: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chamada_id?: string;
          link_externo?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

- [ ] **Step 2: Criar `src/lib/types/entities.ts`**

```ts
import type { Database } from "./database.types";

type T = Database["public"]["Tables"];

export type Chamada = T["chamadas"]["Row"];
export type NovaChamada = T["chamadas"]["Insert"];
export type AtualizaChamada = T["chamadas"]["Update"];

export type Transcricao = T["transcricoes"]["Row"];
export type NovaTranscricao = T["transcricoes"]["Insert"];
export type AtualizaTranscricao = T["transcricoes"]["Update"];

export type Relatorio = T["relatorios"]["Row"];
export type NovoRelatorio = T["relatorios"]["Insert"];
export type AtualizaRelatorio = T["relatorios"]["Update"];

export type Proposta = T["propostas"]["Row"];
export type NovaProposta = T["propostas"]["Insert"];
export type AtualizaProposta = T["propostas"]["Update"];
```

- [ ] **Step 3: Verificar typecheck**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/types
git commit -m "feat(types): stub Database types e aliases de entidades"
```

---

## Task 6: Clientes Supabase (server / client / middleware)

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Criar `src/lib/supabase/server.ts` (uso em Server Components e Route Handlers)**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";
import type { Database } from "@/lib/types/database.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — set não é permitido; refresh acontece via middleware
          }
        },
      },
    },
  );
}
```

- [ ] **Step 2: Criar `src/lib/supabase/client.ts` (uso em Client Components)**

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/config/env";
import type { Database } from "@/lib/types/database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

- [ ] **Step 3: Criar `src/lib/supabase/middleware.ts` (helper de refresh chamado pelo middleware global)**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/config/env";
import type { Database } from "@/lib/types/database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
```

- [ ] **Step 4: Garantir `paths` no `tsconfig.json` para `@/*`**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
grep -A2 '"paths"' tsconfig.json
```

Expected: já existe `"@/*": ["./src/*"]` (create-next-app cria por padrão). Se não existir, abrir `tsconfig.json` e adicionar dentro de `compilerOptions`:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 5: Verificar typecheck**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/supabase tsconfig.json
git commit -m "feat(supabase): clientes server, browser e middleware via @supabase/ssr"
```

---

## Task 7: Middleware global do Next.js (refresh + proteção de rotas)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Criar `src/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/login", "/cadastro"];
const PUBLIC_API_PREFIXES = ["/api/auth"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return response;

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sessão inválida" } },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)"],
};
```

- [ ] **Step 2: Verificar build**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros. Variáveis fake passam a validação Zod (URL válida + string não vazia).

- [ ] **Step 3: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/middleware.ts
git commit -m "feat(auth): middleware global com refresh de sessão e proteção de rotas"
```

---

## Task 8: Helper `requireUser` para Route Handlers

**Files:**
- Create: `src/lib/auth/require-user.ts`

- [ ] **Step 1: Criar `src/lib/auth/require-user.ts`**

```ts
import { AppError } from "@/lib/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("UNAUTHORIZED", "Sessão inválida ou expirada");
  }

  return { user, supabase };
}
```

- [ ] **Step 2: Verificar typecheck**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/auth/require-user.ts
git commit -m "feat(auth): requireUser helper para Route Handlers"
```

---

## Task 9: Páginas de auth (login, cadastro, sair) e callback

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/cadastro/page.tsx`
- Create: `src/app/(auth)/sair/route.ts`
- Create: `src/app/api/auth/callback/route.ts`

- [ ] **Step 1: Criar `src/app/(auth)/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={aoEnviar} className="w-full max-w-sm space-y-4 rounded border p-6">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-sm text-gray-600">
          Sem conta?{" "}
          <Link href="/cadastro" className="underline">
            Criar agora
          </Link>
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Criar `src/app/(auth)/cadastro/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setMensagem(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/api/auth/callback`
            : undefined,
      },
    });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMensagem("Conta criada. Verifique seu email para confirmar.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={aoEnviar} className="w-full max-w-sm space-y-4 rounded border p-6">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          placeholder="Senha (mín. 6 caracteres)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          className="w-full rounded border px-3 py-2"
        />
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {mensagem && <p className="text-sm text-green-700">{mensagem}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {carregando ? "Criando..." : "Criar conta"}
        </button>
        <p className="text-sm text-gray-600">
          Já tem conta?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Criar `src/app/(auth)/sair/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
```

- [ ] **Step 4: Criar `src/app/api/auth/callback/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=callback`);
}
```

- [ ] **Step 5: Verificar build**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 6: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/app
git commit -m "feat(auth): páginas de login, cadastro, sair e callback"
```

---

## Task 10: Dashboard placeholder protegido

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Criar `src/app/(app)/dashboard/page.tsx`**

```tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/sair" className="text-sm underline">
          Sair
        </Link>
      </header>
      <p className="text-gray-700">
        Olá, <strong>{user?.email}</strong>. Em breve você poderá criar chamadas aqui.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Verificar build**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/app/(app)
git commit -m "feat(app): dashboard placeholder protegido"
```

---

## Task 11: Migration inicial do banco (schema + RLS)

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Criar `supabase/migrations/0001_init.sql`**

```sql
-- Extensões necessárias
create extension if not exists "pgcrypto";

-- ========== chamadas ==========
create table public.chamadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  status text not null default 'pendente',
  created_at timestamptz not null default now()
);

create index chamadas_user_id_idx on public.chamadas(user_id);

alter table public.chamadas enable row level security;

create policy "chamadas_select_own" on public.chamadas
  for select using (auth.uid() = user_id);
create policy "chamadas_insert_own" on public.chamadas
  for insert with check (auth.uid() = user_id);
create policy "chamadas_update_own" on public.chamadas
  for update using (auth.uid() = user_id);
create policy "chamadas_delete_own" on public.chamadas
  for delete using (auth.uid() = user_id);

-- ========== transcricoes ==========
create table public.transcricoes (
  id uuid primary key default gen_random_uuid(),
  chamada_id uuid not null references public.chamadas(id) on delete cascade,
  conteudo text not null,
  created_at timestamptz not null default now()
);

create index transcricoes_chamada_id_idx on public.transcricoes(chamada_id);

alter table public.transcricoes enable row level security;

create policy "transcricoes_select_own" on public.transcricoes
  for select using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = transcricoes.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "transcricoes_insert_own" on public.transcricoes
  for insert with check (
    exists (
      select 1 from public.chamadas
      where chamadas.id = transcricoes.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "transcricoes_update_own" on public.transcricoes
  for update using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = transcricoes.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "transcricoes_delete_own" on public.transcricoes
  for delete using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = transcricoes.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );

-- ========== relatorios ==========
create table public.relatorios (
  id uuid primary key default gen_random_uuid(),
  chamada_id uuid not null references public.chamadas(id) on delete cascade,
  conteudo text not null,
  gerado_em timestamptz not null default now()
);

create index relatorios_chamada_id_idx on public.relatorios(chamada_id);

alter table public.relatorios enable row level security;

create policy "relatorios_select_own" on public.relatorios
  for select using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = relatorios.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "relatorios_insert_own" on public.relatorios
  for insert with check (
    exists (
      select 1 from public.chamadas
      where chamadas.id = relatorios.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "relatorios_update_own" on public.relatorios
  for update using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = relatorios.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "relatorios_delete_own" on public.relatorios
  for delete using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = relatorios.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );

-- ========== propostas ==========
create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  chamada_id uuid not null references public.chamadas(id) on delete cascade,
  link_externo text not null,
  status text not null default 'rascunho',
  created_at timestamptz not null default now()
);

create index propostas_chamada_id_idx on public.propostas(chamada_id);

alter table public.propostas enable row level security;

create policy "propostas_select_own" on public.propostas
  for select using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = propostas.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "propostas_insert_own" on public.propostas
  for insert with check (
    exists (
      select 1 from public.chamadas
      where chamadas.id = propostas.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "propostas_update_own" on public.propostas
  for update using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = propostas.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
create policy "propostas_delete_own" on public.propostas
  for delete using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = propostas.chamada_id
        and chamadas.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add supabase/migrations/0001_init.sql
git commit -m "feat(db): migration inicial — 4 entidades + RLS por user_id"
```

---

## Task 12: Validators Zod das 4 entidades

**Files:**
- Create: `src/lib/validators/chamadas.schema.ts`
- Create: `src/lib/validators/transcricoes.schema.ts`
- Create: `src/lib/validators/relatorios.schema.ts`
- Create: `src/lib/validators/propostas.schema.ts`

- [ ] **Step 1: Criar `src/lib/validators/chamadas.schema.ts`**

```ts
import { z } from "zod";

export const criarChamadaSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório").max(200),
  status: z.string().max(50).optional(),
});

export const atualizarChamadaSchema = criarChamadaSchema.partial();

export type CriarChamadaInput = z.infer<typeof criarChamadaSchema>;
export type AtualizarChamadaInput = z.infer<typeof atualizarChamadaSchema>;
```

- [ ] **Step 2: Criar `src/lib/validators/transcricoes.schema.ts`**

```ts
import { z } from "zod";

export const criarTranscricaoSchema = z.object({
  chamada_id: z.string().uuid("chamada_id inválido"),
  conteudo: z.string().min(1, "Conteúdo obrigatório"),
});

export const atualizarTranscricaoSchema = z.object({
  conteudo: z.string().min(1).optional(),
});

export type CriarTranscricaoInput = z.infer<typeof criarTranscricaoSchema>;
export type AtualizarTranscricaoInput = z.infer<typeof atualizarTranscricaoSchema>;
```

- [ ] **Step 3: Criar `src/lib/validators/relatorios.schema.ts`**

```ts
import { z } from "zod";

export const criarRelatorioSchema = z.object({
  chamada_id: z.string().uuid("chamada_id inválido"),
  conteudo: z.string().min(1, "Conteúdo obrigatório"),
});

export const atualizarRelatorioSchema = z.object({
  conteudo: z.string().min(1).optional(),
});

export type CriarRelatorioInput = z.infer<typeof criarRelatorioSchema>;
export type AtualizarRelatorioInput = z.infer<typeof atualizarRelatorioSchema>;
```

- [ ] **Step 4: Criar `src/lib/validators/propostas.schema.ts`**

```ts
import { z } from "zod";

export const criarPropostaSchema = z.object({
  chamada_id: z.string().uuid("chamada_id inválido"),
  link_externo: z.string().url("link_externo deve ser uma URL válida"),
  status: z.string().max(50).optional(),
});

export const atualizarPropostaSchema = z.object({
  link_externo: z.string().url().optional(),
  status: z.string().max(50).optional(),
});

export type CriarPropostaInput = z.infer<typeof criarPropostaSchema>;
export type AtualizarPropostaInput = z.infer<typeof atualizarPropostaSchema>;
```

- [ ] **Step 5: Verificar typecheck**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/validators
git commit -m "feat(validators): schemas Zod das 4 entidades de domínio"
```

---

## Task 13: Repositories das 4 entidades

**Files:**
- Create: `src/lib/repositories/chamadas.repo.ts`
- Create: `src/lib/repositories/transcricoes.repo.ts`
- Create: `src/lib/repositories/relatorios.repo.ts`
- Create: `src/lib/repositories/propostas.repo.ts`

**Convenção:** todos recebem um `SupabaseClient` já autenticado (vindo do `requireUser()`); RLS no banco filtra por `user_id`. Repositories são puros — sem regras de negócio.

- [ ] **Step 1: Criar `src/lib/repositories/chamadas.repo.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type {
  Chamada,
  NovaChamada,
  AtualizaChamada,
} from "@/lib/types/entities";

type Client = SupabaseClient<Database>;

export const chamadasRepo = {
  async listar(supabase: Client): Promise<Chamada[]> {
    const { data, error } = await supabase
      .from("chamadas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async obter(supabase: Client, id: string): Promise<Chamada | null> {
    const { data, error } = await supabase
      .from("chamadas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async criar(supabase: Client, input: NovaChamada): Promise<Chamada> {
    const { data, error } = await supabase
      .from("chamadas")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizaChamada,
  ): Promise<Chamada | null> {
    const { data, error } = await supabase
      .from("chamadas")
      .update(input)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async remover(supabase: Client, id: string): Promise<void> {
    const { error } = await supabase.from("chamadas").delete().eq("id", id);
    if (error) throw error;
  },
};
```

- [ ] **Step 2: Criar `src/lib/repositories/transcricoes.repo.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type {
  Transcricao,
  NovaTranscricao,
  AtualizaTranscricao,
} from "@/lib/types/entities";

type Client = SupabaseClient<Database>;

export const transcricoesRepo = {
  async listar(supabase: Client, chamadaId?: string): Promise<Transcricao[]> {
    let query = supabase.from("transcricoes").select("*").order("created_at", {
      ascending: false,
    });
    if (chamadaId) query = query.eq("chamada_id", chamadaId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async obter(supabase: Client, id: string): Promise<Transcricao | null> {
    const { data, error } = await supabase
      .from("transcricoes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async criar(supabase: Client, input: NovaTranscricao): Promise<Transcricao> {
    const { data, error } = await supabase
      .from("transcricoes")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizaTranscricao,
  ): Promise<Transcricao | null> {
    const { data, error } = await supabase
      .from("transcricoes")
      .update(input)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async remover(supabase: Client, id: string): Promise<void> {
    const { error } = await supabase.from("transcricoes").delete().eq("id", id);
    if (error) throw error;
  },
};
```

- [ ] **Step 3: Criar `src/lib/repositories/relatorios.repo.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type {
  Relatorio,
  NovoRelatorio,
  AtualizaRelatorio,
} from "@/lib/types/entities";

type Client = SupabaseClient<Database>;

export const relatoriosRepo = {
  async listar(supabase: Client, chamadaId?: string): Promise<Relatorio[]> {
    let query = supabase.from("relatorios").select("*").order("gerado_em", {
      ascending: false,
    });
    if (chamadaId) query = query.eq("chamada_id", chamadaId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async obter(supabase: Client, id: string): Promise<Relatorio | null> {
    const { data, error } = await supabase
      .from("relatorios")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async criar(supabase: Client, input: NovoRelatorio): Promise<Relatorio> {
    const { data, error } = await supabase
      .from("relatorios")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizaRelatorio,
  ): Promise<Relatorio | null> {
    const { data, error } = await supabase
      .from("relatorios")
      .update(input)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async remover(supabase: Client, id: string): Promise<void> {
    const { error } = await supabase.from("relatorios").delete().eq("id", id);
    if (error) throw error;
  },
};
```

- [ ] **Step 4: Criar `src/lib/repositories/propostas.repo.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type {
  Proposta,
  NovaProposta,
  AtualizaProposta,
} from "@/lib/types/entities";

type Client = SupabaseClient<Database>;

export const propostasRepo = {
  async listar(supabase: Client, chamadaId?: string): Promise<Proposta[]> {
    let query = supabase.from("propostas").select("*").order("created_at", {
      ascending: false,
    });
    if (chamadaId) query = query.eq("chamada_id", chamadaId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async obter(supabase: Client, id: string): Promise<Proposta | null> {
    const { data, error } = await supabase
      .from("propostas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async criar(supabase: Client, input: NovaProposta): Promise<Proposta> {
    const { data, error } = await supabase
      .from("propostas")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizaProposta,
  ): Promise<Proposta | null> {
    const { data, error } = await supabase
      .from("propostas")
      .update(input)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async remover(supabase: Client, id: string): Promise<void> {
    const { error } = await supabase.from("propostas").delete().eq("id", id);
    if (error) throw error;
  },
};
```

- [ ] **Step 5: Verificar typecheck**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/repositories
git commit -m "feat(repositories): CRUD das 4 entidades sobre Supabase"
```

---

## Task 14: Services das 4 entidades

**Files:**
- Create: `src/lib/services/chamadas.service.ts`
- Create: `src/lib/services/transcricoes.service.ts`
- Create: `src/lib/services/relatorios.service.ts`
- Create: `src/lib/services/propostas.service.ts`

**Convenção:** services orquestram, validam regras e lançam `AppError`. Recebem `(supabase, userId, input)`. Para `chamadas`, injetam `user_id` no insert. Para entidades-filha, garantem que a `chamada_id` referenciada pertença ao usuário antes de criar.

- [ ] **Step 1: Criar `src/lib/services/chamadas.service.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { chamadasRepo } from "@/lib/repositories/chamadas.repo";
import { AppError } from "@/lib/errors/app-error";
import type { Database } from "@/lib/types/database.types";
import type {
  CriarChamadaInput,
  AtualizarChamadaInput,
} from "@/lib/validators/chamadas.schema";

type Client = SupabaseClient<Database>;

export const chamadasService = {
  async listar(supabase: Client) {
    return chamadasRepo.listar(supabase);
  },

  async obter(supabase: Client, id: string) {
    const chamada = await chamadasRepo.obter(supabase, id);
    if (!chamada) throw new AppError("NOT_FOUND", "Chamada não encontrada");
    return chamada;
  },

  async criar(supabase: Client, userId: string, input: CriarChamadaInput) {
    return chamadasRepo.criar(supabase, {
      user_id: userId,
      titulo: input.titulo,
      status: input.status,
    });
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizarChamadaInput,
  ) {
    const atualizada = await chamadasRepo.atualizar(supabase, id, input);
    if (!atualizada) throw new AppError("NOT_FOUND", "Chamada não encontrada");
    return atualizada;
  },

  async remover(supabase: Client, id: string) {
    await chamadasRepo.remover(supabase, id);
  },
};
```

- [ ] **Step 2: Criar `src/lib/services/transcricoes.service.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { transcricoesRepo } from "@/lib/repositories/transcricoes.repo";
import { chamadasRepo } from "@/lib/repositories/chamadas.repo";
import { AppError } from "@/lib/errors/app-error";
import type { Database } from "@/lib/types/database.types";
import type {
  CriarTranscricaoInput,
  AtualizarTranscricaoInput,
} from "@/lib/validators/transcricoes.schema";

type Client = SupabaseClient<Database>;

export const transcricoesService = {
  async listar(supabase: Client, chamadaId?: string) {
    return transcricoesRepo.listar(supabase, chamadaId);
  },

  async obter(supabase: Client, id: string) {
    const t = await transcricoesRepo.obter(supabase, id);
    if (!t) throw new AppError("NOT_FOUND", "Transcrição não encontrada");
    return t;
  },

  async criar(supabase: Client, input: CriarTranscricaoInput) {
    const chamada = await chamadasRepo.obter(supabase, input.chamada_id);
    if (!chamada) throw new AppError("NOT_FOUND", "Chamada não encontrada");

    return transcricoesRepo.criar(supabase, {
      chamada_id: input.chamada_id,
      conteudo: input.conteudo,
    });
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizarTranscricaoInput,
  ) {
    const atualizada = await transcricoesRepo.atualizar(supabase, id, input);
    if (!atualizada) throw new AppError("NOT_FOUND", "Transcrição não encontrada");
    return atualizada;
  },

  async remover(supabase: Client, id: string) {
    await transcricoesRepo.remover(supabase, id);
  },
};
```

- [ ] **Step 3: Criar `src/lib/services/relatorios.service.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { relatoriosRepo } from "@/lib/repositories/relatorios.repo";
import { chamadasRepo } from "@/lib/repositories/chamadas.repo";
import { AppError } from "@/lib/errors/app-error";
import type { Database } from "@/lib/types/database.types";
import type {
  CriarRelatorioInput,
  AtualizarRelatorioInput,
} from "@/lib/validators/relatorios.schema";

type Client = SupabaseClient<Database>;

export const relatoriosService = {
  async listar(supabase: Client, chamadaId?: string) {
    return relatoriosRepo.listar(supabase, chamadaId);
  },

  async obter(supabase: Client, id: string) {
    const r = await relatoriosRepo.obter(supabase, id);
    if (!r) throw new AppError("NOT_FOUND", "Relatório não encontrado");
    return r;
  },

  // TODO(integração): gerar `conteudo` a partir da transcrição com IA.
  // Por enquanto recebe o conteúdo pronto pelo body.
  async criar(supabase: Client, input: CriarRelatorioInput) {
    const chamada = await chamadasRepo.obter(supabase, input.chamada_id);
    if (!chamada) throw new AppError("NOT_FOUND", "Chamada não encontrada");

    return relatoriosRepo.criar(supabase, {
      chamada_id: input.chamada_id,
      conteudo: input.conteudo,
    });
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizarRelatorioInput,
  ) {
    const atualizado = await relatoriosRepo.atualizar(supabase, id, input);
    if (!atualizado) throw new AppError("NOT_FOUND", "Relatório não encontrado");
    return atualizado;
  },

  async remover(supabase: Client, id: string) {
    await relatoriosRepo.remover(supabase, id);
  },
};
```

- [ ] **Step 4: Criar `src/lib/services/propostas.service.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { propostasRepo } from "@/lib/repositories/propostas.repo";
import { chamadasRepo } from "@/lib/repositories/chamadas.repo";
import { AppError } from "@/lib/errors/app-error";
import type { Database } from "@/lib/types/database.types";
import type {
  CriarPropostaInput,
  AtualizarPropostaInput,
} from "@/lib/validators/propostas.schema";

type Client = SupabaseClient<Database>;

export const propostasService = {
  async listar(supabase: Client, chamadaId?: string) {
    return propostasRepo.listar(supabase, chamadaId);
  },

  async obter(supabase: Client, id: string) {
    const p = await propostasRepo.obter(supabase, id);
    if (!p) throw new AppError("NOT_FOUND", "Proposta não encontrada");
    return p;
  },

  // TODO(integração): gerar link_externo a partir do relatório (template comercial).
  async criar(supabase: Client, input: CriarPropostaInput) {
    const chamada = await chamadasRepo.obter(supabase, input.chamada_id);
    if (!chamada) throw new AppError("NOT_FOUND", "Chamada não encontrada");

    return propostasRepo.criar(supabase, {
      chamada_id: input.chamada_id,
      link_externo: input.link_externo,
      status: input.status,
    });
  },

  async atualizar(
    supabase: Client,
    id: string,
    input: AtualizarPropostaInput,
  ) {
    const atualizada = await propostasRepo.atualizar(supabase, id, input);
    if (!atualizada) throw new AppError("NOT_FOUND", "Proposta não encontrada");
    return atualizada;
  },

  async remover(supabase: Client, id: string) {
    await propostasRepo.remover(supabase, id);
  },
};
```

- [ ] **Step 5: Verificar typecheck**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/lib/services
git commit -m "feat(services): regras de negócio das 4 entidades + placeholders de IA"
```

---

## Task 15: Route Handlers — entidade `chamadas`

**Files:**
- Create: `src/app/api/chamadas/route.ts`
- Create: `src/app/api/chamadas/[id]/route.ts`

- [ ] **Step 1: Criar `src/app/api/chamadas/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { chamadasService } from "@/lib/services/chamadas.service";
import { criarChamadaSchema } from "@/lib/validators/chamadas.schema";

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const data = await chamadasService.listar(supabase);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const json = await request.json();
    const parsed = criarChamadaSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await chamadasService.criar(supabase, user.id, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 2: Criar `src/app/api/chamadas/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { chamadasService } from "@/lib/services/chamadas.service";
import { atualizarChamadaSchema } from "@/lib/validators/chamadas.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const data = await chamadasService.obter(supabase, id);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const json = await req.json();
    const parsed = atualizarChamadaSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await chamadasService.atualizar(supabase, id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    await chamadasService.remover(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 3: Verificar build**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros; rotas `/api/chamadas` e `/api/chamadas/[id]` aparecem na listagem.

- [ ] **Step 4: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/app/api/chamadas
git commit -m "feat(api): endpoints CRUD de chamadas"
```

---

## Task 16: Route Handlers — entidade `transcricoes`

**Files:**
- Create: `src/app/api/transcricoes/route.ts`
- Create: `src/app/api/transcricoes/[id]/route.ts`

- [ ] **Step 1: Criar `src/app/api/transcricoes/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { transcricoesService } from "@/lib/services/transcricoes.service";
import { criarTranscricaoSchema } from "@/lib/validators/transcricoes.schema";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { searchParams } = new URL(request.url);
    const chamadaId = searchParams.get("chamada_id") ?? undefined;
    const data = await transcricoesService.listar(supabase, chamadaId);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser();
    const json = await request.json();
    const parsed = criarTranscricaoSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await transcricoesService.criar(supabase, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 2: Criar `src/app/api/transcricoes/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { transcricoesService } from "@/lib/services/transcricoes.service";
import { atualizarTranscricaoSchema } from "@/lib/validators/transcricoes.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const data = await transcricoesService.obter(supabase, id);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const json = await req.json();
    const parsed = atualizarTranscricaoSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await transcricoesService.atualizar(supabase, id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    await transcricoesService.remover(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 3: Verificar build**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 4: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/app/api/transcricoes
git commit -m "feat(api): endpoints CRUD de transcrições"
```

---

## Task 17: Route Handlers — entidade `relatorios`

**Files:**
- Create: `src/app/api/relatorios/route.ts`
- Create: `src/app/api/relatorios/[id]/route.ts`

- [ ] **Step 1: Criar `src/app/api/relatorios/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { relatoriosService } from "@/lib/services/relatorios.service";
import { criarRelatorioSchema } from "@/lib/validators/relatorios.schema";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { searchParams } = new URL(request.url);
    const chamadaId = searchParams.get("chamada_id") ?? undefined;
    const data = await relatoriosService.listar(supabase, chamadaId);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser();
    const json = await request.json();
    const parsed = criarRelatorioSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await relatoriosService.criar(supabase, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 2: Criar `src/app/api/relatorios/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { relatoriosService } from "@/lib/services/relatorios.service";
import { atualizarRelatorioSchema } from "@/lib/validators/relatorios.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const data = await relatoriosService.obter(supabase, id);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const json = await req.json();
    const parsed = atualizarRelatorioSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await relatoriosService.atualizar(supabase, id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    await relatoriosService.remover(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 3: Verificar build**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 4: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/app/api/relatorios
git commit -m "feat(api): endpoints CRUD de relatórios"
```

---

## Task 18: Route Handlers — entidade `propostas`

**Files:**
- Create: `src/app/api/propostas/route.ts`
- Create: `src/app/api/propostas/[id]/route.ts`

- [ ] **Step 1: Criar `src/app/api/propostas/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { propostasService } from "@/lib/services/propostas.service";
import { criarPropostaSchema } from "@/lib/validators/propostas.schema";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { searchParams } = new URL(request.url);
    const chamadaId = searchParams.get("chamada_id") ?? undefined;
    const data = await propostasService.listar(supabase, chamadaId);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser();
    const json = await request.json();
    const parsed = criarPropostaSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await propostasService.criar(supabase, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 2: Criar `src/app/api/propostas/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { propostasService } from "@/lib/services/propostas.service";
import { atualizarPropostaSchema } from "@/lib/validators/propostas.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const data = await propostasService.obter(supabase, id);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const json = await req.json();
    const parsed = atualizarPropostaSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await propostasService.atualizar(supabase, id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    await propostasService.remover(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 3: Verificar build**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros; todas as rotas `/api/<entidade>` e `/api/<entidade>/[id]` aparecem na listagem.

- [ ] **Step 4: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add src/app/api/propostas
git commit -m "feat(api): endpoints CRUD de propostas"
```

---

## Task 19: Dockerfile + .dockerignore

**Files:**
- Create: `docker/Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Criar `docker/Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis NEXT_PUBLIC_* precisam estar disponíveis no build (são inlined no bundle).
# No Easypanel, configure-as como Build Args ou env vars do serviço.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

- [ ] **Step 2: Criar `.dockerignore`**

```
node_modules
.next
.git
.gitignore
.env
.env.local
.env*.local
npm-debug.log
README.md
docs
supabase
docker
.vscode
.idea
.DS_Store
```

- [ ] **Step 3: (Verificação local opcional) — pular se Docker não estiver instalado**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
docker build -f docker/Dockerfile --build-arg NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder -t aios:dev . || echo "Docker não disponível — verificação real fica para o Easypanel"
```

Expected: ou build conclui com `Successfully tagged aios:dev`, ou mensagem "Docker não disponível". Qualquer um é aceitável aqui — o build real acontece no Easypanel.

- [ ] **Step 4: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add docker/Dockerfile .dockerignore
git commit -m "chore(docker): Dockerfile multi-stage com Next standalone"
```

---

## Task 20: README com instruções de setup

**Files:**
- Create: `README.md`

- [ ] **Step 1: Criar `README.md`**

````markdown
# AIOS

Sistema operacional de IA — MVP para ler transcrições de calls, gerar relatórios e propostas comerciais.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- Zod (validação)
- Docker / Easypanel para deploy

## Arquitetura do backend

```
HTTP (Route Handler)  →  Service  →  Repository  →  Supabase
        ↑
   Middleware (Auth via cookie Supabase)
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

## Deploy no Easypanel

1. **Criar App** apontando para este repositório.
2. **Build:** Docker, dockerfile path `docker/Dockerfile`.
3. **Build Args** (necessários pois `NEXT_PUBLIC_*` são inlined no bundle):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Environment Variables** do serviço (runtime):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcional, só se for usar jobs admin)
5. **Porta:** 3000.
6. **Domínio:** configure no painel do Easypanel; HTTPS automático.

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
````

- [ ] **Step 2: Commit**

```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git add README.md
git commit -m "docs: README com setup local, deploy Easypanel e mapa da API"
```

---

## Verificação Final

- [ ] **Step 1: Build limpo end-to-end**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
NEXT_PUBLIC_SUPABASE_URL=http://placeholder.local NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
```

Expected: build conclui sem erros. Listagem de rotas inclui:
- `/`, `/login`, `/cadastro`, `/dashboard`, `/sair`
- `/api/auth/callback`
- `/api/chamadas`, `/api/chamadas/[id]`
- `/api/transcricoes`, `/api/transcricoes/[id]`
- `/api/relatorios`, `/api/relatorios/[id]`
- `/api/propostas`, `/api/propostas/[id]`

- [ ] **Step 2: Typecheck limpo**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Git status limpo**

Run:
```bash
cd "/Users/guilhermereis/Projects/DEV/CLAUDE/G4/Aula 2/AIOS"
git status
```

Expected: `nothing to commit, working tree clean`.

---

## Pós-Plano (o que você precisa fornecer depois)

Com o scaffold pronto, basta:

1. **Credenciais Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) → eu rodo a migration `0001_init.sql` e ajudo a testar login/signup ponta-a-ponta.
2. **Credenciais Easypanel** → eu te guio (ou executo, se houver MCP/API exposta) na criação do app, build args, env vars e primeiro deploy.
3. **Opcional:** `SUPABASE_SERVICE_ROLE_KEY` se quisermos jobs admin server-side no futuro.
