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
  for select using ((select auth.uid()) = user_id);
create policy "chamadas_insert_own" on public.chamadas
  for insert with check ((select auth.uid()) = user_id);
create policy "chamadas_update_own" on public.chamadas
  for update using ((select auth.uid()) = user_id);
create policy "chamadas_delete_own" on public.chamadas
  for delete using ((select auth.uid()) = user_id);

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
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "transcricoes_insert_own" on public.transcricoes
  for insert with check (
    exists (
      select 1 from public.chamadas
      where chamadas.id = transcricoes.chamada_id
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "transcricoes_update_own" on public.transcricoes
  for update using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = transcricoes.chamada_id
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "transcricoes_delete_own" on public.transcricoes
  for delete using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = transcricoes.chamada_id
        and chamadas.user_id = (select auth.uid())
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
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "relatorios_insert_own" on public.relatorios
  for insert with check (
    exists (
      select 1 from public.chamadas
      where chamadas.id = relatorios.chamada_id
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "relatorios_update_own" on public.relatorios
  for update using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = relatorios.chamada_id
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "relatorios_delete_own" on public.relatorios
  for delete using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = relatorios.chamada_id
        and chamadas.user_id = (select auth.uid())
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
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "propostas_insert_own" on public.propostas
  for insert with check (
    exists (
      select 1 from public.chamadas
      where chamadas.id = propostas.chamada_id
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "propostas_update_own" on public.propostas
  for update using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = propostas.chamada_id
        and chamadas.user_id = (select auth.uid())
    )
  );
create policy "propostas_delete_own" on public.propostas
  for delete using (
    exists (
      select 1 from public.chamadas
      where chamadas.id = propostas.chamada_id
        and chamadas.user_id = (select auth.uid())
    )
  );
