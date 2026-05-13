import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { AppError, errorResponse } from "@/lib/errors/app-error";
import { chamadasService } from "@/lib/services/chamadas.service";
import { relatoriosService } from "@/lib/services/relatorios.service";
import { transcricoesService } from "@/lib/services/transcricoes.service";
import { propostasService } from "@/lib/services/propostas.service";
import { gerarProposta } from "@/lib/ia/gerar-proposta";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();

    await chamadasService.obter(supabase, id);

    const relatorios = await relatoriosService.listar(supabase, id);
    if (relatorios.length === 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Chamada ainda não foi analisada — gere o relatório primeiro.",
      );
    }
    const relatorio = relatorios[0];

    const transcricoes = await transcricoesService.listar(supabase, id);
    if (transcricoes.length === 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Chamada não tem transcrição registrada.",
      );
    }
    const transcricao = transcricoes[0];

    const propostaIA = await gerarProposta({
      relatorio,
      transcricao: transcricao.conteudo,
    });

    const proposta = await propostasService.criar(supabase, {
      chamada_id: id,
      ...propostaIA,
    });

    return NextResponse.json({ proposta }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
