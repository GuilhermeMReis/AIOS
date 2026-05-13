import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Relatorio } from "@/lib/types/entities";
import { corProbabilidade, corSentimento, formatarBRL } from "@/lib/ui/cores";

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

export function PainelAnalise({ relatorio }: { relatorio: Relatorio }) {
  const dores = asArray(relatorio.dores_identificadas);
  const objecoes = asArray(relatorio.objecoes);
  const proximos = asArray(relatorio.proximos_passos);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Probabilidade de fechamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-semibold tabular-nums ${corProbabilidade(
                relatorio.probabilidade_fechamento,
              )}`}
            >
              {relatorio.probabilidade_fechamento ?? "—"}
              {relatorio.probabilidade_fechamento != null && (
                <span className="text-lg font-normal text-muted-foreground">%</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Valor estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatarBRL(relatorio.valor_estimado_brl)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sentimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {relatorio.sentimento ? (
              <Badge variant={corSentimento(relatorio.sentimento)} className="text-sm">
                {relatorio.sentimento}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>
      </div>

      {relatorio.resumo_executivo && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {relatorio.resumo_executivo}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>BANT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CampoBant titulo="Budget" valor={relatorio.bant_budget} />
          <Separator />
          <CampoBant titulo="Autoridade" valor={relatorio.bant_autoridade} />
          <Separator />
          <CampoBant titulo="Necessidade" valor={relatorio.bant_necessidade} />
          <Separator />
          <CampoBant titulo="Prazo" valor={relatorio.bant_prazo} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <ListaChips titulo="Dores identificadas" itens={dores} />
        <ListaChips titulo="Objeções" itens={objecoes} variant="outline" />
        <ListaChips titulo="Próximos passos" itens={proximos} variant="secondary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise completa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {relatorio.conteudo}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CampoBant({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <p className="text-sm">{valor ?? <span className="text-muted-foreground">Não discutido na call</span>}</p>
    </div>
  );
}

function ListaChips({
  titulo,
  itens,
  variant = "default",
}: {
  titulo: string;
  itens: string[];
  variant?: "default" | "secondary" | "outline";
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-2">
            {itens.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge variant={variant} className="mt-0.5 shrink-0">
                  {i + 1}
                </Badge>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
