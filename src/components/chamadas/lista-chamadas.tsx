import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Chamada } from "@/lib/types/entities";
import { formatarData } from "@/lib/ui/cores";

type Linha = Chamada & {
  tem_relatorio: boolean;
  tem_proposta: boolean;
};

export function ListaChamadas({ chamadas }: { chamadas: Linha[] }) {
  if (chamadas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-12 text-center">
        <p className="text-sm font-medium">Nenhuma chamada ainda.</p>
        <p className="text-sm text-muted-foreground">
          Clique em <span className="font-medium">+ Nova chamada</span> para começar.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Análise</TableHead>
          <TableHead>Proposta</TableHead>
          <TableHead className="text-right">Criada em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {chamadas.map((c) => (
          <TableRow key={c.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/dashboard/chamadas/${c.id}`}
                className="font-medium hover:underline"
              >
                {c.titulo}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{c.status}</Badge>
            </TableCell>
            <TableCell>
              {c.tem_relatorio ? (
                <Badge variant="default">gerada</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {c.tem_proposta ? (
                <Badge variant="secondary">gerada</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatarData(c.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
