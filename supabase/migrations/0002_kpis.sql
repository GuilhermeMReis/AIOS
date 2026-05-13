-- KPIs estruturados extraídos da call (relatorios) e da proposta (propostas).
-- Mantém os campos narrativos existentes (relatorios.conteudo, propostas.link_externo)
-- como fonte de verdade longa; estes campos complementam pra permitir filtros, agregações
-- e dashboards. Todos nullable — IA preenche só o que extraiu/decidiu sem quebrar insert.

-- ========== relatorios ==========
alter table public.relatorios
  add column resumo_executivo text,
  add column sentimento text,
  add column dores_identificadas jsonb not null default '[]'::jsonb,
  add column objecoes jsonb not null default '[]'::jsonb,
  add column bant_budget text,
  add column bant_autoridade text,
  add column bant_necessidade text,
  add column bant_prazo text,
  add column proximos_passos jsonb not null default '[]'::jsonb,
  add column probabilidade_fechamento smallint,
  add column valor_estimado_brl numeric(12,2);

alter table public.relatorios
  add constraint relatorios_sentimento_check
    check (sentimento is null or sentimento in ('positivo','neutro','negativo'));

alter table public.relatorios
  add constraint relatorios_probabilidade_check
    check (probabilidade_fechamento is null
           or (probabilidade_fechamento between 0 and 100));

-- ========== propostas ==========
alter table public.propostas
  add column titulo text,
  add column resumo_solucao text,
  add column escopo jsonb not null default '[]'::jsonb,
  add column valor_total numeric(12,2),
  add column moeda text not null default 'BRL',
  add column condicoes_pagamento text,
  add column prazo_entrega_dias smallint,
  add column validade_dias smallint not null default 30,
  add column enviada_em timestamptz,
  add column versao smallint not null default 1;

alter table public.propostas
  add constraint propostas_status_check
    check (status in ('rascunho','enviada','em_negociacao','aceita','rejeitada','expirada'));

alter table public.propostas
  add constraint propostas_prazo_entrega_check
    check (prazo_entrega_dias is null or prazo_entrega_dias >= 0);

alter table public.propostas
  add constraint propostas_validade_check
    check (validade_dias >= 0);

alter table public.propostas
  add constraint propostas_versao_check
    check (versao >= 1);

alter table public.propostas
  add constraint propostas_valor_total_check
    check (valor_total is null or valor_total >= 0);
