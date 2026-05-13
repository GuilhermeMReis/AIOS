import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Proposta } from "@/lib/types/entities";
import { corStatusProposta, formatarBRL, formatarData } from "@/lib/ui/cores";

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

export function PainelProposta({ proposta }: { proposta: Proposta }) {
  const escopo = asArray(proposta.escopo);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={corStatusProposta(proposta.status)}>{proposta.status}</Badge>
        <Badge variant="outline">v{proposta.versao}</Badge>
        <span className="text-sm text-muted-foreground">
          Criada em {formatarData(proposta.created_at)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Valor total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatarBRL(proposta.valor_total)}
            </p>
            <p className="text-xs text-muted-foreground">{proposta.moeda}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prazo de entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {proposta.prazo_entrega_dias ?? "—"}
              {proposta.prazo_entrega_dias != null && (
                <span className="ml-1 text-base font-normal text-muted-foreground">dias</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Validade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {proposta.validade_dias}
              <span className="ml-1 text-base font-normal text-muted-foreground">dias</span>
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Enviada em
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{formatarData(proposta.enviada_em)}</p>
          </CardContent>
        </Card>
      </div>

      {proposta.titulo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{proposta.titulo}</CardTitle>
          </CardHeader>
        </Card>
      )}

      {proposta.resumo_solucao && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da solução</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {proposta.resumo_solucao}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Escopo</CardTitle>
        </CardHeader>
        <CardContent>
          {escopo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem itens registrados.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {escopo.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {proposta.condicoes_pagamento && (
        <Card>
          <CardHeader>
            <CardTitle>Condições de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{proposta.condicoes_pagamento}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <a
          href={proposta.link_externo}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          ↗ Abrir proposta externa
        </a>
      </div>
    </div>
  );
}
